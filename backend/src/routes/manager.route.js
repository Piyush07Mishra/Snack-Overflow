import express from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import {
  getMyTeam,
  getTeamExpenses,
} from "../controllers/manager.controller.js";

const router = express.Router();

router.use(requireAuth, requireRole("manager", "director", "admin"));
router.get("/team", getMyTeam);
router.get("/expenses", getTeamExpenses);

export default router;
