import { body } from "express-validator";

export const createRuleValidator = [
  body("name").trim().notEmpty().withMessage("name is required"),
  body("ruleType")
    .isIn(["sequential", "percentage", "specific_approver", "hybrid"])
    .withMessage("invalid ruleType"),
  body("percentageThreshold")
    .optional({ values: "falsy" })
    .isFloat({ min: 0, max: 100 })
    .withMessage("percentageThreshold must be 0-100"),
  body("steps").optional().isArray(),
];
