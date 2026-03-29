import { pool } from "../lib/db.js";

const User = {
  findByEmail: async (email) => {
    const r = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return r.rows[0] || null;
  },

  findById: async (id) => {
    const r = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.manager_id, u.is_manager_approver,
              u.company_id, u.profile_pic, c.base_currency as company_currency, c.name as company_name
       FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.id = $1`,
      [id],
    );
    return r.rows[0] || null;
  },

  create: async ({
    fullName,
    email,
    password,
    companyId,
    role = "employee",
  }) => {
    const r = await pool.query(
      `INSERT INTO users (full_name, email, password, company_id, role)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [fullName, email, password, companyId, role],
    );
    return r.rows[0];
  },

  findByCompany: async (companyId) => {
    const r = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.manager_id, u.is_manager_approver,
              m.full_name as manager_name
       FROM users u LEFT JOIN users m ON u.manager_id = m.id
       WHERE u.company_id = $1 ORDER BY u.created_at DESC`,
      [companyId],
    );
    return r.rows;
  },

  // companyId is optional — omit it for system-level updates like password reset
  update: async (id, fields, companyId) => {
    if (!fields || Object.keys(fields).length === 0) return null;
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");

    if (companyId) {
      const r = await pool.query(
        `UPDATE users SET ${setClause}
         WHERE id = $${keys.length + 1} AND company_id = $${keys.length + 2}
         RETURNING *`,
        [...values, id, companyId],
      );
      return r.rows[0];
    } else {
      const r = await pool.query(
        `UPDATE users SET ${setClause}
         WHERE id = $${keys.length + 1}
         RETURNING *`,
        [...values, id],
      );
      return r.rows[0];
    }
  },
};

export default User;
