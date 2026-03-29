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
import { validate } from "../middlewares/validation.middleware.js";
import {
  submitExpenseValidator,
  expenseActionValidator,
} from "../validators/expense.validator.js";

const router = express.Router();

router.use(requireAuth);
router.post("/", submitExpenseValidator, validate, submitExpense); // employee
router.get("/my", getMyExpenses); // employee
router.get("/all", requireRole("admin"), getAllExpenses); // admin
router.get("/pending", requireRole("admin", "manager"), getPendingApprovals); // manager/admin
router.get("/:id", getExpenseDetail);
router.post("/:id/action", requireRole("admin", "manager", "director"), expenseActionValidator, validate, actOnExpense);
router.post("/:id/override", requireRole("admin"), overrideExpense);

export default router;
