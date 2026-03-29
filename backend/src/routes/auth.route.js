import express from "express";
import {
  signUp,
  logIn,
  logOut,
  getMe,
  forgotPassword,
  sendPasswordToUser,
} from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  signupValidator,
  loginValidator,
} from "../validators/auth.validator.js";

const router = express.Router();

router.post("/signup", signupValidator, validate, signUp);
router.post("/login", loginValidator, validate, logIn);
router.get("/logout", logOut);
router.get("/me", requireAuth, getMe);
router.post("/forgot-password", forgotPassword);
router.post(
  "/send-password/:userId",
  requireAuth,
  requireRole("admin"),
  sendPasswordToUser,
);

export default router;
