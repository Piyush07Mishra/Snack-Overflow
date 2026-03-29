import { pool } from "../lib/db.js";

const Expense = {
  create: async ({
    companyId,
    submittedBy,
    amount,
    currency,
    amountInBase,
    category,
    description,
    expenseDate,
    receiptUrl,
    ocrData,
  }) => {
    const r = await pool.query(
      `INSERT INTO expenses (company_id, submitted_by, amount, currency, amount_in_base, category, description, expense_date, receipt_url, ocr_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        companyId,
        submittedBy,
        amount,
        currency,
        amountInBase,
        category,
        description,
        expenseDate,
        receiptUrl,
        ocrData ? JSON.stringify(ocrData) : null,
      ],
    );
    return r.rows[0];
  },

  findByUser: async (userId) => {
    const r = await pool.query(
      `SELECT e.*, u.full_name as submitter_name
       FROM expenses e JOIN users u ON e.submitted_by = u.id
       WHERE e.submitted_by = $1 ORDER BY e.created_at DESC`,
      [userId],
    );
    return r.rows;
  },

  findByCompany: async (companyId) => {
    const r = await pool.query(
      `SELECT e.*, u.full_name as submitter_name
       FROM expenses e JOIN users u ON e.submitted_by = u.id
       WHERE e.company_id = $1 ORDER BY e.created_at DESC`,
      [companyId],
    );
    return r.rows;
  },

  findById: async (id) => {
    const r = await pool.query(
      `SELECT e.*, u.full_name as submitter_name, u.email as submitter_email
       FROM expenses e JOIN users u ON e.submitted_by = u.id WHERE e.id = $1`,
      [id],
    );
    return r.rows[0] || null;
  },

  updateStatus: async (id, status, currentStep) => {
    const r = await pool.query(
      `UPDATE expenses SET status=$1, current_step=$2 WHERE id=$3 RETURNING *`,
      [status, currentStep, id],
    );
    return r.rows[0];
  },

  // Expenses pending approval for a specific approver
  findPendingForApprover: async (approverId) => {
    const r = await pool.query(
      `SELECT e.*, u.full_name as submitter_name, ea.id as approval_id, ea.step_order
       FROM expense_approvals ea
       JOIN expenses e ON ea.expense_id = e.id
       JOIN users u ON e.submitted_by = u.id
       WHERE ea.approver_id = $1 AND ea.status = 'pending' AND e.status IN ('pending','in_review')
       ORDER BY e.created_at DESC`,
      [approverId],
    );
    return r.rows;
  },
};

export default Expense;
