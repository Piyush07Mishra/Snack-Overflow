import express from "express";
import {
  submitExpense,
  getMyExpenses,
  getAllExpenses,
  getPendingApprovals,
  getExpenseDetail,
  actOnExpense,
  overrideExpense,
} from "../controllers/expense.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth);
router.post("/", submitExpense); // employee
router.get("/my", getMyExpenses); // employee
router.get("/all", requireRole("admin"), getAllExpenses); // admin
router.get("/pending", requireRole("admin", "manager"), getPendingApprovals); // manager/admin
router.get("/:id", getExpenseDetail);
router.post("/:id/action", requireRole("admin", "manager"), actOnExpense);
router.post("/:id/override", requireRole("admin"), overrideExpense);

export default router;
