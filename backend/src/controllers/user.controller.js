import User from "../models/user.model.js";
import bcrypt from "bcrypt";

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
  const { fullName, email, password, role, managerId, isManagerApprover } =
    req.body;
  if (!fullName || !email || !password || !role) {
    return res
      .status(400)
      .json({ message: "fullName, email, password, role are required" });
  }
  if (!["employee", "manager"].includes(role)) {
    return res
      .status(400)
      .json({ message: "Role must be employee or manager" });
  }
  try {
    const existing = await User.findByEmail(email);
    if (existing)
      return res.status(400).json({ message: "Email already in use" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      fullName,
      email,
      password: hashed,
      companyId: req.user.company_id,
      role,
    });

    // Set manager and isManagerApprover if provided
    const updates = {};
    if (managerId) updates.manager_id = managerId;
    if (isManagerApprover !== undefined)
      updates.is_manager_approver = isManagerApprover;
    if (Object.keys(updates).length) await User.update(newUser.id, updates);

    const updated = await User.findById(newUser.id);
    res.status(201).json({
      user: {
        id: updated.id,
        fullName: updated.full_name,
        email: updated.email,
        role: updated.role,
        managerId: updated.manager_id,
        isManagerApprover: updated.is_manager_approver,
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
    const updates = {};
    if (role) updates.role = role;
    if (managerId !== undefined) updates.manager_id = managerId || null;
    if (isManagerApprover !== undefined)
      updates.is_manager_approver = isManagerApprover;

    const updated = await User.update(id, updates);
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
