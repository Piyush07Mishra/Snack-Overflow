import { body } from "express-validator";

export const submitExpenseValidator = [
  body("amount").isFloat({ gt: 0 }).withMessage("amount must be > 0"),
  body("currency").trim().notEmpty().withMessage("currency is required"),
  body("category").trim().notEmpty().withMessage("category is required"),
  body("expenseDate").isISO8601().withMessage("expenseDate must be a valid date"),
  body("receiptUrl").optional({ values: "falsy" }).isURL().withMessage("receiptUrl must be a valid URL"),
];

export const expenseActionValidator = [
  body("action").isIn(["approved", "rejected"]).withMessage("action must be approved or rejected"),
  body("comment").optional().isString(),
];
