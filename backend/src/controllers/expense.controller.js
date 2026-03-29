import Expense from "../models/expense.model.js";
import ApprovalRule from "../models/approvalRule.model.js";
import { pool } from "../lib/db.js";
import axios from "axios";
import approvalEngine from "../services/approvalEngine.service.js";

export const uploadReceipt = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Receipt file is required" });
    }

    const receiptUrl = `${req.protocol}://${req.get("host")}/uploads/receipts/${req.file.filename}`;
    res.status(201).json({
      message: "Receipt uploaded successfully",
      receiptUrl,
    });
  } catch (err) {
    res.status(500).json({ message: "Error uploading receipt" });
  }
};

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

export const submitExpense = async (req, res) => {
  const {
    amount,
    currency,
    category,
    description,
    expenseDate,
    receiptUrl,
    ruleId,
    status,
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
      status: status === "draft" ? "draft" : "submitted",
    });

    if (status === "draft") {
      return res.status(201).json({ message: "Expense saved as draft", expense });
    }

    // Build approval queue
    const rule = ruleId
      ? await ApprovalRule.findById(ruleId, req.user.company_id)
      : null;
    const approvals = approvalEngine.buildApprovalQueue({
      submitter: req.user,
      rule,
    });

    if (approvals.length === 0) {
      // No approvers → auto approve
      await Expense.updateStatus(expense.id, "approved", 1, req.user.company_id);
      return res
        .status(201)
        .json({ message: "Expense submitted and auto-approved", expense });
    }

    // Insert approval records
    await approvalEngine.seedExpenseApprovals({ expenseId: expense.id, approvals });

    await Expense.updateStatus(
      expense.id,
      "in_review",
      approvals[0].stepOrder,
      req.user.company_id,
    );
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
    const expenses = await Expense.findByUser(req.user.id, req.user.company_id);
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
    const expenses = await Expense.findPendingForApprover(req.user.id, req.user.company_id);
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ message: "Error fetching pending approvals" });
  }
};

export const getExpenseDetail = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id, req.user.company_id);
    if (!expense) return res.status(404).json({ message: "Expense not found" });

    const approvals = await pool.query(
      `SELECT ea.*, u.full_name as approver_name FROM expense_approvals ea
       JOIN users u ON ea.approver_id = u.id
       JOIN expenses e ON ea.expense_id = e.id
       WHERE ea.expense_id = $1 AND e.company_id = $2
       ORDER BY ea.step_order`,
      [req.params.id, req.user.company_id],
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
    const result = await approvalEngine.processAction({
      expenseId,
      action,
      comment,
      approverId: req.user.id,
      companyId: req.user.company_id,
    });
    if (!result.ok) return res.status(result.status).json({ message: result.message });
    res.json({ message: result.message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error processing approval" });
  }
};

// Admin override
export const overrideExpense = async (req, res) => {
  const { status } = req.body;
  try {
    const expense = await Expense.updateStatus(
      req.params.id,
      status,
      0,
      req.user.company_id,
    );
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: `Expense ${status} by admin`, expense });
  } catch (err) {
    res.status(500).json({ message: "Error overriding expense" });
  }
};
