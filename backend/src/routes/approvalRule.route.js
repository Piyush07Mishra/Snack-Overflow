import express from "express";
import {
  getRules,
  createRule,
  deleteRule,
  getManagers,
} from "../controllers/approvalRule.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);
router.get("/managers", getManagers);
router.get("/", requireRole("admin"), getRules);
router.post("/", requireRole("admin"), createRule);
router.delete("/:id", requireRole("admin"), deleteRule);

export default router;
