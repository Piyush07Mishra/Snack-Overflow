import { pool } from "../lib/db.js";
import Expense from "../models/expense.model.js";

const isSequentialRule = (rule) => {
  if (!rule) return true;
  if (typeof rule.sequential_approval === "boolean") return rule.sequential_approval;
  return rule.rule_type === "sequential";
};

const getMinApprovalPercentage = (rule) => {
  if (!rule) return null;
  if (rule.min_approvals_percentage !== null && rule.min_approvals_percentage !== undefined) {
    return parseFloat(rule.min_approvals_percentage);
  }
  if (rule.percentage_threshold !== null && rule.percentage_threshold !== undefined) {
    return parseFloat(rule.percentage_threshold);
  }
  return null;
};

const buildApprovalQueue = ({ submitter, rule }) => {
  const approvals = [];
  const managerApprovalRequired =
    rule?.manager_approval_required ?? submitter.is_manager_approver;

  if (managerApprovalRequired && submitter.manager_id) {
    approvals.push({ approverId: submitter.manager_id, stepOrder: 0, role: "manager" });
  }

  if (rule?.steps?.length) {
    for (const step of rule.steps) {
      approvals.push({
        approverId: step.approver_id,
        stepOrder: step.step_order,
        role: step.approver_role || null,
      });
    }
  }

  // Avoid duplicate approvers when manager is also explicitly in configured steps
  const seen = new Set();
  return approvals.filter((a) => {
    const key = `${a.approverId}:${a.stepOrder}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const seedExpenseApprovals = async ({ expenseId, approvals }) => {
  for (const a of approvals) {
    await pool.query(
      `INSERT INTO expense_approvals (expense_id, approver_id, step_order, approver_role)
       VALUES ($1,$2,$3,$4)`,
      [expenseId, a.approverId, a.stepOrder, a.role],
    );
  }
};

const processAction = async ({ expenseId, action, comment, approverId, companyId }) => {
  const approvalRes = await pool.query(
    `SELECT ea.*
     FROM expense_approvals ea
     JOIN expenses e ON e.id = ea.expense_id
     WHERE ea.expense_id = $1 AND ea.approver_id = $2 AND ea.status = 'pending' AND e.company_id = $3`,
    [expenseId, approverId, companyId],
  );

  if (!approvalRes.rows[0]) {
    return { ok: false, status: 403, message: "No pending approval found for you on this expense" };
  }

  const approval = approvalRes.rows[0];
  const expense = await Expense.findById(expenseId, companyId);
  if (!expense) return { ok: false, status: 404, message: "Expense not found" };

  const ruleRes = await pool.query(
    `SELECT ar.* FROM approval_rules ar
     JOIN expenses e ON e.company_id = ar.company_id
     WHERE e.id = $1 AND e.company_id = $2
     ORDER BY ar.created_at DESC LIMIT 1`,
    [expenseId, companyId],
  );
  const rule = ruleRes.rows[0];

  const allApprovalsResBefore = await pool.query(
    `SELECT * FROM expense_approvals WHERE expense_id=$1`,
    [expenseId],
  );
  const allBefore = allApprovalsResBefore.rows;
  if (isSequentialRule(rule)) {
    const minPendingStep = allBefore
      .filter((a) => a.status === "pending")
      .reduce((min, a) => Math.min(min, a.step_order), Number.POSITIVE_INFINITY);
    if (Number.isFinite(minPendingStep) && approval.step_order !== minPendingStep) {
      return {
        ok: false,
        status: 403,
        message: "This approval is waiting for an earlier step",
      };
    }
  }

  await pool.query(
    `UPDATE expense_approvals SET status=$1, comment=$2, acted_at=NOW() WHERE id=$3`,
    [action, comment || null, approval.id],
  );

  if (action === "rejected") {
    await pool.query(
      `UPDATE expense_approvals SET status='rejected' WHERE expense_id=$1 AND status='pending'`,
      [expenseId],
    );
    await Expense.updateStatus(expenseId, "rejected", approval.step_order, companyId);
    return { ok: true, message: "Expense rejected" };
  }

  const allApprovalsRes = await pool.query(
    `SELECT * FROM expense_approvals WHERE expense_id=$1`,
    [expenseId],
  );
  const allApprovals = allApprovalsRes.rows;
  const total = allApprovals.length;
  const approvedCount = allApprovals.filter((a) => a.status === "approved").length;
  const pendingApprovals = allApprovals.filter((a) => a.status === "pending");

  if (rule?.specific_approver_id) {
    if (rule.specific_approver_id === approverId) {
      await pool.query(
        `UPDATE expense_approvals SET status='approved' WHERE expense_id=$1 AND status='pending'`,
        [expenseId],
      );
      await Expense.updateStatus(expenseId, "approved", approval.step_order, companyId);
      return { ok: true, message: "Expense auto-approved by specific approver" };
    }
  }

  if (rule?.auto_approve_role) {
    const approverRes = await pool.query(
      `SELECT role FROM users WHERE id = $1 AND company_id = $2`,
      [approverId, companyId],
    );
    if (approverRes.rows[0]?.role === rule.auto_approve_role) {
      await pool.query(
        `UPDATE expense_approvals SET status='approved' WHERE expense_id=$1 AND status='pending'`,
        [expenseId],
      );
      await Expense.updateStatus(expenseId, "approved", approval.step_order, companyId);
      return { ok: true, message: "Expense auto-approved by approver role" };
    }
  }

  const minPct = getMinApprovalPercentage(rule);
  if (minPct !== null) {
    const pct = total ? (approvedCount / total) * 100 : 0;
    if (pct >= minPct) {
      await Expense.updateStatus(expenseId, "approved", approval.step_order, companyId);
      return { ok: true, message: "Expense approved by percentage threshold" };
    }
  }

  if (pendingApprovals.length > 0) {
    const nextStep = pendingApprovals.sort((a, b) => a.step_order - b.step_order)[0];
    await Expense.updateStatus(expenseId, "in_review", nextStep.step_order, companyId);
    return { ok: true, message: "Approved, moved to next approver" };
  }

  await Expense.updateStatus(expenseId, "approved", approval.step_order, companyId);
  return { ok: true, message: "Expense fully approved" };
};

export default {
  buildApprovalQueue,
  seedExpenseApprovals,
  processAction,
};
