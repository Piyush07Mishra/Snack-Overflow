import Expense from "../models/expense.model.js";
import ApprovalRule from "../models/approvalRule.model.js";
import { pool } from "../lib/db.js";
import axios from "axios";

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  try {
    const res = await axios.get(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
    );
    const rate = res.data.rates[toCurrency];
    return rate ? parseFloat((amount * rate).toFixed(2)) : amount;
  } catch (_) {
    return amount;
  }
};

// Build approval queue for an expense based on rule + manager approver setting
const buildApprovalQueue = async (expense, submitter, rule) => {
  const approvals = [];

  // If employee has a manager and is_manager_approver is true → manager goes first
  if (submitter.is_manager_approver && submitter.manager_id) {
    approvals.push({ approverId: submitter.manager_id, stepOrder: 0 });
  }

  if (rule) {
    for (const step of rule.steps) {
      approvals.push({
        approverId: step.approver_id,
        stepOrder: step.step_order,
      });
    }
  }

  return approvals;
};

export const submitExpense = async (req, res) => {
  const {
    amount,
    currency,
    category,
    description,
    expenseDate,
    receiptUrl,
    ruleId,
  } = req.body;
  if (!amount || !currency || !category || !expenseDate) {
    return res
      .status(400)
      .json({
        message: "amount, currency, category, expenseDate are required",
      });
  }

  try {
    const baseCurrency = req.user.company_currency;
    const amountInBase = await convertCurrency(
      parseFloat(amount),
      currency,
      baseCurrency,
    );

    const expense = await Expense.create({
      companyId: req.user.company_id,
      submittedBy: req.user.id,
      amount,
      currency,
      amountInBase,
      category,
      description,
      expenseDate,
      receiptUrl: receiptUrl || null,
    });

    // Build approval queue
    const rule = ruleId ? await ApprovalRule.findById(ruleId) : null;
    const approvals = await buildApprovalQueue(expense, req.user, rule);

    if (approvals.length === 0) {
      // No approvers → auto approve
      await Expense.updateStatus(expense.id, "approved", 1);
      return res
        .status(201)
        .json({ message: "Expense submitted and auto-approved", expense });
    }

    // Insert approval records
    for (const a of approvals) {
      await pool.query(
        `INSERT INTO expense_approvals (expense_id, approver_id, step_order) VALUES ($1,$2,$3)`,
        [expense.id, a.approverId, a.stepOrder],
      );
    }

    await Expense.updateStatus(expense.id, "in_review", approvals[0].stepOrder);
    res
      .status(201)
      .json({ message: "Expense submitted successfully", expense });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error submitting expense" });
  }
};

export const getMyExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findByUser(req.user.id);
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ message: "Error fetching expenses" });
  }
};

export const getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findByCompany(req.user.company_id);
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ message: "Error fetching expenses" });
  }
};

export const getPendingApprovals = async (req, res) => {
  try {
    const expenses = await Expense.findPendingForApprover(req.user.id);
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ message: "Error fetching pending approvals" });
  }
};

export const getExpenseDetail = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const approvals = await pool.query(
      `SELECT ea.*, u.full_name as approver_name FROM expense_approvals ea
       JOIN users u ON ea.approver_id = u.id WHERE ea.expense_id = $1 ORDER BY ea.step_order`,
      [req.params.id],
    );
    res.json({ expense, approvals: approvals.rows });
  } catch (err) {
    res.status(500).json({ message: "Error fetching expense" });
  }
};

export const actOnExpense = async (req, res) => {
  const { action, comment } = req.body; // action: 'approved' | 'rejected'
  const expenseId = req.params.id;

  if (!["approved", "rejected"].includes(action)) {
    return res
      .status(400)
      .json({ message: "action must be approved or rejected" });
  }

  try {
    // Find this approver's pending approval record
    const approvalRes = await pool.query(
      `SELECT * FROM expense_approvals WHERE expense_id=$1 AND approver_id=$2 AND status='pending'`,
      [expenseId, req.user.id],
    );
    if (!approvalRes.rows[0]) {
      return res
        .status(403)
        .json({ message: "No pending approval found for you on this expense" });
    }

    const approval = approvalRes.rows[0];
    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    // Update this approval record
    await pool.query(
      `UPDATE expense_approvals SET status=$1, comment=$2, acted_at=NOW() WHERE id=$3`,
      [action, comment || null, approval.id],
    );

    if (action === "rejected") {
      // Reject all remaining pending approvals and mark expense rejected
      await pool.query(
        `UPDATE expense_approvals SET status='rejected' WHERE expense_id=$1 AND status='pending'`,
        [expenseId],
      );
      await Expense.updateStatus(expenseId, "rejected", approval.step_order);
      return res.json({ message: "Expense rejected" });
    }

    // Check approval rule for this expense's company
    const ruleRes = await pool.query(
      `SELECT ar.* FROM approval_rules ar
       JOIN expenses e ON e.company_id = ar.company_id
       WHERE e.id = $1 LIMIT 1`,
      [expenseId],
    );
    const rule = ruleRes.rows[0];

    // Get all approvals for this expense
    const allApprovalsRes = await pool.query(
      `SELECT * FROM expense_approvals WHERE expense_id=$1`,
      [expenseId],
    );
    const allApprovals = allApprovalsRes.rows;
    const total = allApprovals.length;
    const approvedCount = allApprovals.filter(
      (a) => a.status === "approved",
    ).length;
    const pendingApprovals = allApprovals.filter((a) => a.status === "pending");

    // Check specific approver rule
    if (
      rule?.rule_type === "specific_approver" ||
      rule?.rule_type === "hybrid"
    ) {
      if (rule.specific_approver_id === req.user.id) {
        await pool.query(
          `UPDATE expense_approvals SET status='approved' WHERE expense_id=$1 AND status='pending'`,
          [expenseId],
        );
        await Expense.updateStatus(expenseId, "approved", approval.step_order);
        return res.json({
          message: "Expense auto-approved by specific approver",
        });
      }
    }

    // Check percentage rule
    if (rule?.rule_type === "percentage" || rule?.rule_type === "hybrid") {
      const pct = (approvedCount / total) * 100;
      if (pct >= parseFloat(rule.percentage_threshold)) {
        await Expense.updateStatus(expenseId, "approved", approval.step_order);
        return res.json({
          message: "Expense approved by percentage threshold",
        });
      }
    }

    // Sequential: move to next step
    if (pendingApprovals.length > 0) {
      const nextStep = pendingApprovals.sort(
        (a, b) => a.step_order - b.step_order,
      )[0];
      await Expense.updateStatus(expenseId, "in_review", nextStep.step_order);
      return res.json({ message: "Approved, moved to next approver" });
    }

    // All approved
    await Expense.updateStatus(expenseId, "approved", approval.step_order);
    res.json({ message: "Expense fully approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error processing approval" });
  }
};

// Admin override
export const overrideExpense = async (req, res) => {
  const { status } = req.body;
  try {
    const expense = await Expense.updateStatus(req.params.id, status, 0);
    res.json({ message: `Expense ${status} by admin`, expense });
  } catch (err) {
    res.status(500).json({ message: "Error overriding expense" });
  }
};
