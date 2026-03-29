import express from "express";
import {
  signUp,
  logIn,
  logOut,
  getMe,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", logIn);
router.get("/logout", logOut);
router.get("/me", getMe);

export default router;
