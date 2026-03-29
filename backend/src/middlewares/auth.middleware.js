import { pool } from "../lib/db.js";
import jwt from "jsonwebtoken";

const getTokenFromHeader = (req) => {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
};

export const requireAuth = async (req, res, next) => {
  try {
    let userId = null;
    const token = getTokenFromHeader(req);

    if (token) {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || process.env.SESSION_SECRET,
      );
      userId = payload.userId;
    } else if (req.session?.userId) {
      userId = req.session.userId;
    }

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const result = await pool.query(
      `SELECT u.*, c.base_currency as company_currency, c.name as company_name
       FROM users u LEFT JOIN companies c ON u.company_id = c.id
       WHERE u.id = $1`,
      [userId],
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
