import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import { pool } from "../lib/db.js";

const generateTempPassword = () => Math.random().toString(36).slice(-10) + "A1!";

// Admin: list all users in company
export const getUsers = async (req, res) => {
  try {
    const users = await User.findByCompany(req.user.company_id);
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Admin: create employee or manager
export const createUser = async (req, res) => {
  const {
    fullName,
    email: rawEmail,
    password,
    role,
    managerId,
    isManagerApprover,
  } = req.body;
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  if (!fullName || !email || !role) {
    return res
      .status(400)
      .json({ message: "fullName, email, role are required" });
  }
  if (!["employee", "manager", "director"].includes(role)) {
    return res
      .status(400)
      .json({ message: "Role must be employee, manager, or director" });
  }
  try {
    const existing = await User.findByEmail(email);
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    let validManagerId = null;
    if (managerId) {
      const managerRes = await pool.query(
        `SELECT id, role FROM users WHERE id = $1 AND company_id = $2`,
        [managerId, req.user.company_id],
      );
      const manager = managerRes.rows[0];
      if (!manager) {
        return res.status(400).json({ message: "Selected manager is not in your company" });
      }
      if (!["manager", "admin", "director"].includes(manager.role)) {
        return res.status(400).json({ message: "Selected manager must be manager, admin, or director" });
      }
      validManagerId = manager.id;
    }

    const plainPassword = password || generateTempPassword();
    const hashed = await bcrypt.hash(plainPassword, 10);
    const newUser = await User.create({
      fullName,
      email,
      password: hashed,
      companyId: req.user.company_id,
      role,
      mustChangePassword: !password,
    });

    // Set manager and isManagerApprover if provided
    const updates = {};
    if (validManagerId) updates.manager_id = validManagerId;
    if (isManagerApprover !== undefined)
      updates.is_manager_approver = isManagerApprover;
    if (Object.keys(updates).length)
      await User.update(newUser.id, updates, req.user.company_id);

    const updated = await User.findById(newUser.id);
    res.status(201).json({
      user: {
        id: updated.id,
        fullName: updated.full_name,
        email: updated.email,
        role: updated.role,
        managerId: updated.manager_id,
        isManagerApprover: updated.is_manager_approver,
        mustChangePassword: updated.must_change_password,
        temporaryPassword: !password ? plainPassword : undefined,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating user" });
  }
};

// Admin: update user role / manager assignment
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { role, managerId, isManagerApprover } = req.body;
  try {
    const existing = await User.findById(id);
    if (!existing || existing.company_id !== req.user.company_id) {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = {};
    if (role) updates.role = role;

    if (managerId !== undefined) {
      if (!managerId) {
        updates.manager_id = null;
      } else {
        if (parseInt(managerId, 10) === parseInt(id, 10)) {
          return res.status(400).json({ message: "A user cannot be their own manager" });
        }
        const managerRes = await pool.query(
          `SELECT id, role FROM users WHERE id = $1 AND company_id = $2`,
          [managerId, req.user.company_id],
        );
        const manager = managerRes.rows[0];
        if (!manager) {
          return res.status(400).json({ message: "Selected manager is not in your company" });
        }
        if (!["manager", "admin", "director"].includes(manager.role)) {
          return res.status(400).json({ message: "Selected manager must be manager, admin, or director" });
        }
        updates.manager_id = manager.id;
      }
    }

    if (isManagerApprover !== undefined)
      updates.is_manager_approver = isManagerApprover;

    const effectiveRole = role || existing.role;
    if (["manager", "director", "admin"].includes(effectiveRole)) {
      updates.manager_id = null;
    }

    const updated = await User.update(id, updates, req.user.company_id);
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json({ user: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating user" });
  }
};

// Admin: delete user
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const { pool } = await import("../lib/db.js");
    await pool.query("DELETE FROM users WHERE id = $1 AND company_id = $2", [
      id,
      req.user.company_id,
    ]);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting user" });
  }
};
