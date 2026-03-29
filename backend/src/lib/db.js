import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const initDB = async () => {
  try {
    // Companies table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(100) NOT NULL,
        base_currency VARCHAR(10) NOT NULL,
        currency VARCHAR(10),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Users table — create fresh if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','manager','employee','director')),
        manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_manager_approver BOOLEAN DEFAULT false,
        must_change_password BOOLEAN DEFAULT false,
        profile_pic TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Migrate: add missing columns to users if they don't exist yet
    const migrations = [
      `ALTER TABLE companies ADD COLUMN IF NOT EXISTS currency VARCHAR(10)`,
      `UPDATE companies SET currency = base_currency WHERE currency IS NULL`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'employee'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_manager_approver BOOLEAN DEFAULT false`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false`,
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check`,
      `ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin','manager','employee','director'))`,
      `ALTER TABLE expense_approvals ADD COLUMN IF NOT EXISTS approver_role VARCHAR(50)`,
    ];
    for (const sql of migrations) {
      try {
        await pool.query(sql);
      } catch (_) {}
    }

    // Drop old columns that no longer apply
    const drops = [
      `ALTER TABLE users DROP COLUMN IF EXISTS country`,
      `ALTER TABLE users DROP COLUMN IF EXISTS base_currency`,
    ];
    for (const sql of drops) {
      try {
        await pool.query(sql);
      } catch (_) {}
    }

    // Expenses
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        submitted_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(12,2) NOT NULL,
        currency VARCHAR(10) NOT NULL,
        amount_in_base NUMERIC(12,2),
        category VARCHAR(100) NOT NULL,
        description TEXT,
        expense_date DATE NOT NULL,
        receipt_url TEXT,
        ocr_data JSONB,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','in_review')),
        current_step INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Approval rules
    await pool.query(`
      CREATE TABLE IF NOT EXISTS approval_rules (
        id SERIAL PRIMARY KEY,
        company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('sequential','percentage','specific_approver','hybrid')),
        percentage_threshold NUMERIC(5,2),
        specific_approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Approval steps
    await pool.query(`
      CREATE TABLE IF NOT EXISTS approval_steps (
        id SERIAL PRIMARY KEY,
        rule_id INTEGER REFERENCES approval_rules(id) ON DELETE CASCADE,
        step_order INTEGER NOT NULL,
        approver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        approver_role VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Expense approvals
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_approvals (
        id SERIAL PRIMARY KEY,
        expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE,
        approver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        approver_role VARCHAR(50),
        step_order INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
        comment TEXT,
        acted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("DB connected and tables initialized :)");
  } catch (error) {
    console.error("Error initializing DB:", error.message);
  }
};
