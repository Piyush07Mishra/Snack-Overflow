import ApprovalRule from "../models/approvalRule.model.js";
import { pool } from "../lib/db.js";

export const getRules = async (req, res) => {
  try {
    const rules = await ApprovalRule.findByCompany(req.user.company_id);
    res.json({ rules });
  } catch (err) {
    res.status(500).json({ message: "Error fetching rules" });
  }
};

export const createRule = async (req, res) => {
  const {
    name,
    ruleType,
    managerApprovalRequired,
    sequentialApproval,
    minApprovalsPercentage,
    autoApproveRole,
    percentageThreshold,
    specificApproverId,
    steps,
  } = req.body;
  if (!name) {
    return res.status(400).json({ message: "name is required" });
  }
  try {
    const rule = await ApprovalRule.create({
      companyId: req.user.company_id,
      name,
      ruleType,
      managerApprovalRequired,
      sequentialApproval,
      minApprovalsPercentage,
      autoApproveRole,
      percentageThreshold,
      specificApproverId,
    });

    if (steps && Array.isArray(steps)) {
      for (const step of steps) {
        await ApprovalRule.addStep({
          ruleId: rule.id,
          stepOrder: step.stepOrder || step.step_order,
          approverId: step.approverId || step.approver_id,
          approverRole: step.approverRole || step.approver_role,
        });
      }
    }

    const full = await ApprovalRule.findById(rule.id, req.user.company_id);
    res.status(201).json({ rule: full });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating rule" });
  }
};

export const deleteRule = async (req, res) => {
  try {
    await ApprovalRule.deleteById(req.params.id, req.user.company_id);
    res.json({ message: "Rule deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting rule" });
  }
};

export const getManagers = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, full_name, email, role FROM users WHERE company_id=$1 AND role IN ('manager','admin','director') ORDER BY full_name`,
      [req.user.company_id],
    );
    res.json({ managers: r.rows });
  } catch (err) {
    res.status(500).json({ message: "Error fetching managers" });
  }
};
