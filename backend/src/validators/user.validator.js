import { body } from "express-validator";

export const createUserValidator = [
  body("fullName")
    .trim()
    .isLength({ min: 2 })
    .withMessage("fullName is required")
    .matches(/^[A-Za-z][A-Za-z .'-]*$/)
    .withMessage("fullName can contain only letters and spaces"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("role")
    .isIn(["employee", "manager", "director"])
    .withMessage("Role must be employee, manager, or director"),
  body("password")
    .optional({ values: "falsy" })
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 chars"),
  body("managerId")
    .optional({ values: "falsy", nullable: true })
    .isInt({ min: 1 })
    .withMessage("managerId must be a positive integer"),
  body("isManagerApprover").optional().isBoolean(),
];

export const updateUserValidator = [
  body("role").optional().isIn(["employee", "manager", "director", "admin"]),
  body("managerId").optional({ nullable: true }).isInt({ min: 1 }),
  body("isManagerApprover").optional().isBoolean(),
];
