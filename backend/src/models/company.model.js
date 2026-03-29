import { pool } from "../lib/db.js";

const Company = {
  create: async ({ name, country, baseCurrency }) => {
    const r = await pool.query(
      `INSERT INTO companies (name, country, base_currency, currency) VALUES ($1,$2,$3,$3) RETURNING *`,
      [name, country, baseCurrency],
    );
    return r.rows[0];
  },
  findById: async (id) => {
    const r = await pool.query("SELECT * FROM companies WHERE id = $1", [id]);
    return r.rows[0] || null;
  },
};

export default Company;
