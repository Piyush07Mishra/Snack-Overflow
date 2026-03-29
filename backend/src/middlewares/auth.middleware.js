import { pool } from "../lib/db.js";

export const requireAuth = async (req, res, next) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const result = await pool.query(
      `SELECT u.*, c.base_currency as company_currency, c.name as company_name
       FROM users u LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.id = $1`,
      [req.session.userId],
    );
    if (!result.rows[0])
      return res.status(401).json({ message: "User not found" });
    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(500).json({ message: "Auth error" });
  }
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
