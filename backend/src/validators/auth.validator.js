import { body } from "express-validator";

export const signupValidator = [
  body("fullName").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("confirmPassword").custom((value, { req }) => value === req.body.password).withMessage("Passwords do not match"),
  body("country").trim().notEmpty().withMessage("Country is required"),
];

export const loginValidator = [
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];
