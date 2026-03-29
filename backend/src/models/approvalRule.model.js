import { pool } from "../lib/db.js";

const ApprovalRule = {
  create: async ({
    companyId,
    name,
    ruleType,
    percentageThreshold,
    specificApproverId,
  }) => {
    const r = await pool.query(
      `INSERT INTO approval_rules (company_id, name, rule_type, percentage_threshold, specific_approver_id)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [
        companyId,
        name,
        ruleType,
        percentageThreshold || null,
        specificApproverId || null,
      ],
    );
    return r.rows[0];
  },

  addStep: async ({ ruleId, stepOrder, approverId, approverRole }) => {
    const r = await pool.query(
      `INSERT INTO approval_steps (rule_id, step_order, approver_id, approver_role)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [ruleId, stepOrder, approverId, approverRole || null],
    );
    return r.rows[0];
  },

  findByCompany: async (companyId) => {
    const rules = await pool.query(
      `SELECT * FROM approval_rules WHERE company_id = $1 ORDER BY created_at DESC`,
      [companyId],
    );
    for (const rule of rules.rows) {
      const steps = await pool.query(
        `SELECT s.*, u.full_name as approver_name FROM approval_steps s
         JOIN users u ON s.approver_id = u.id WHERE s.rule_id = $1 ORDER BY s.step_order`,
        [rule.id],
      );
      rule.steps = steps.rows;
    }
    return rules.rows;
  },

  findById: async (id, companyId) => {
    const r = await pool.query(
      `SELECT * FROM approval_rules WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    );
    if (!r.rows[0]) return null;
    const rule = r.rows[0];
    const steps = await pool.query(
      `SELECT s.*, u.full_name as approver_name FROM approval_steps s
       JOIN users u ON s.approver_id = u.id WHERE s.rule_id = $1 ORDER BY s.step_order`,
      [rule.id],
    );
    rule.steps = steps.rows;
    return rule;
  },

  deleteById: async (id, companyId) => {
    await pool.query(
      `DELETE FROM approval_rules WHERE id = $1 AND company_id = $2`,
      [id, companyId],
    );
  },
};

export default ApprovalRule;
