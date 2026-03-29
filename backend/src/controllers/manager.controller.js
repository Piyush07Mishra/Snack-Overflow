import User from "../models/user.model.js";
import Expense from "../models/expense.model.js";

export const getMyTeam = async (req, res) => {
  try {
    const team = await User.findTeamByManager(req.user.id, req.user.company_id);
    res.json({ team });
  } catch (err) {
    res.status(500).json({ message: "Error fetching team" });
  }
};

export const getTeamExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findByManagerTeam(req.user.id, req.user.company_id);
    res.json({ expenses });
  } catch (err) {
    res.status(500).json({ message: "Error fetching team expenses" });
  }
};
