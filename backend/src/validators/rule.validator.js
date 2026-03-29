import { body } from "express-validator";

export const createRuleValidator = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("ruleType")
    .optional({ values: "falsy" })
    .isIn(["sequential", "percentage", "specific_approver", "hybrid"])
    .withMessage("invalid ruleType"),
  body("managerApprovalRequired")
    .optional()
    .isBoolean()
    .withMessage("managerApprovalRequired must be boolean"),
  body("sequentialApproval")
    .optional()
    .isBoolean()
    .withMessage("sequentialApproval must be boolean"),
  body("minApprovalsPercentage")
    .optional({ values: "falsy" })
    .isFloat({ min: 0, max: 100 })
    .withMessage("minApprovalsPercentage must be 0-100"),
  body("autoApproveRole")
    .optional({ values: "falsy" })
    .isIn(["admin", "manager", "director", "employee"])
    .withMessage("invalid autoApproveRole"),
  body("percentageThreshold")
    .optional({ values: "falsy" })
    .isFloat({ min: 0, max: 100 })
    .withMessage("percentageThreshold must be 0-100"),
  body("specificApproverId")
    .optional({ values: "falsy" })
    .isInt({ gt: 0 })
    .withMessage("specificApproverId must be a positive integer"),
  body("steps").optional().isArray(),
];
