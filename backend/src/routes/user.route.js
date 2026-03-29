import express from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createUserValidator,
  updateUserValidator,
} from "../validators/user.validator.js";

const router = express.Router();

router.use(requireAuth);
router.get("/", requireRole("admin"), getUsers);
router.post("/", requireRole("admin"), createUserValidator, validate, createUser);
router.put("/:id", requireRole("admin"), updateUserValidator, validate, updateUser);
router.delete("/:id", requireRole("admin"), deleteUser);

export default router;
