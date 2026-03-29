# Feature Implementation Document

This document summarizes what is currently implemented in the project by inspecting backend and frontend source files and the DB bootstrap logic.

## 0. Latest Upgrade Snapshot (March 2026)

- Authentication upgraded to JWT flow (signup/login returns token, frontend stores token, API requests send bearer token).
- express-validator added with centralized validation middleware.
- Multi-tenant hardening added to sensitive flows (company-scoped expense detail/action/override and approval rule read/delete).
- Director role support added in DB role checks, route access, and approver selection.
- Approval engine extracted to service layer: `backend/src/services/approvalEngine.service.js`.
- Manager module added:
  - `GET /api/manager/team`
  - `GET /api/manager/expenses`
- Frontend pages added for manager/director:
  - Team members view
  - Team expenses view
- User creation upgraded with optional generated temporary password and must-change-password flag.

## 1. Backend Implementation

### 1.1 App and middleware
- Express server with JSON + URL-encoded body parsing.
- CORS configured for frontend origin `http://localhost:5173` with credentials.
- Session-based auth using:
  - `express-session`
  - `connect-pg-simple` store in PostgreSQL
- Environment variables used:
  - `DATABASE_URL`
  - `SESSION_SECRET`
  - `PORT`

### 1.2 Auth module (`/api/auth`)
Implemented endpoints:
- `POST /signup`
- `POST /login`
- `GET /logout`
- `GET /me`

Implemented signup behavior:
- Required fields: fullName, email, password, confirmPassword, country.
- Email format validation (strict regex).
- Name validation:
  - min length 2
  - only letters/spaces/apostrophe/dot/hyphen pattern
  - numbers are rejected
- Password checks:
  - min length 6
  - password and confirmPassword must match
- Duplicate email check.
- Auto-create company on signup.
- Base currency resolved from restcountries API (fallback USD).
- First user created as `admin`.
- Password hashing with bcrypt.
- Session user ID stored.

Implemented login behavior:
- Required email + password.
- Email format validation.
- Credential check with bcrypt compare.
- Session user ID stored.
- Returns normalized user payload including company info.

### 1.3 Auth/role guards
- `requireAuth`: blocks unauthenticated requests and attaches `req.user` with company info.
- `requireRole(...roles)`: role-based access control.

### 1.4 User management (`/api/users`) [admin only]
- `GET /` list users in company.
- `POST /` create employee/manager.
- `PUT /:id` update role/manager/isManagerApprover.
- `DELETE /:id` delete user in company.

Implemented constraints in controller:
- Create requires fullName, email, password, role.
- Allowed create roles: employee, manager.
- Duplicate email blocked.
- Password hashed with bcrypt.

### 1.5 Expense module (`/api/expenses`)
Implemented endpoints:
- `POST /` submit expense
- `GET /my` current user expenses
- `GET /all` admin all-company expenses
- `GET /pending` manager/admin pending approvals
- `GET /:id` expense detail + approval timeline
- `POST /:id/action` manager/admin approve/reject
- `POST /:id/override` admin force approve/reject

Implemented submit flow:
- Required: amount, currency, category, expenseDate.
- Amount conversion to company base currency via exchange rate API.
- Create expense row.
- Build approval queue:
  - manager-first step if submitter has `is_manager_approver` + `manager_id`
  - optional rule steps from selected approval rule
- If queue empty -> auto-approve.
- Else insert `expense_approvals` records and set status to `in_review`.

Implemented approval action flow:
- Approver can only act on own pending record.
- Reject path:
  - mark own record rejected
  - mark remaining pending approvals rejected
  - set expense rejected
- Approve path:
  - supports rule types: sequential, percentage, specific_approver, hybrid
  - specific approver/hybrid shortcut can auto-approve
  - percentage/hybrid can auto-approve at threshold
  - else advance to next pending step
  - final fallback marks fully approved

### 1.6 Approval rule module (`/api/rules`)
Implemented endpoints:
- `GET /managers` (authenticated)
- `GET /` (admin)
- `POST /` (admin)
- `DELETE /:id` (admin)

Implemented rule behavior:
- Rule types supported:
  - sequential
  - percentage
  - specific_approver
  - hybrid
- Step insertion supported via `steps[]` with order, approver, role label.
- Full rule fetch includes expanded steps and approver names.

### 1.7 Models implemented
- `company.model.js`: create/findById.
- `user.model.js`: findByEmail/findById/create/findByCompany/update.
- `expense.model.js`: create/findByUser/findByCompany/findById/updateStatus/findPendingForApprover.
- `approvalRule.model.js`: create/addStep/findByCompany/findById/deleteById.

### 1.8 Not wired/partial backend items
- `chat.controller.js` exists but is empty.
- `chat.model.js` uses Mongoose schema and is not connected to active PostgreSQL flow.
- No chat routes are mounted in server.

---

## 2. Frontend Implementation

### 2.1 Routing and auth state
- Route guards with `ProtectedRoute`.
- Role-based route restrictions.
- Auth state bootstrapped from `GET /auth/me`.
- Axios configured with `withCredentials: true` and backend base URL.

### 2.2 Implemented pages
- `SignUp`:
  - country list + currency hint from restcountries
  - client-side validation:
    - valid email format
    - full name format (numbers blocked)
    - password length >= 6
    - confirm password match
- `SignIn`:
  - client-side email format validation
- `Dashboard`:
  - role-dependent stats + recent expenses
- `SubmitExpense`:
  - expense form with categories, date, receipt URL, optional approval rule
- `MyExpenses`:
  - own expenses list + status + detail link
- `AllExpenses` (admin):
  - filter by status
  - admin override actions
- `ExpenseDetail`:
  - detail view + timeline
  - approver action panel
- `PendingApprovals` (manager/admin):
  - queue list with review links
- `Users` (admin):
  - create/edit/delete users
  - manager assignment and manager-approver toggle
- `ApprovalRules` (admin):
  - create/delete rules
  - percentage/specific approver/hybrid fields
  - dynamic multi-step builder

### 2.3 Role navigation implemented in sidebar
- Admin: dashboard, users, all expenses, approval rules.
- Manager: dashboard, pending approvals, my expenses.
- Employee: dashboard, submit expense, my expenses.

---

## 3. PostgreSQL Schema (from initialization code)

Database is initialized in app startup using `initDB()`.

### 3.1 `companies`
- `id SERIAL PRIMARY KEY`
- `name VARCHAR(255) NOT NULL`
- `country VARCHAR(100) NOT NULL`
- `base_currency VARCHAR(10) NOT NULL`
- `created_at TIMESTAMP DEFAULT NOW()`

### 3.2 `users`
- `id SERIAL PRIMARY KEY`
- `company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE`
- `full_name VARCHAR(255) NOT NULL`
- `email VARCHAR(255) UNIQUE NOT NULL`
- `password VARCHAR(255) NOT NULL`
- `role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','manager','employee'))`
- `manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL`
- `is_manager_approver BOOLEAN DEFAULT false`
- `profile_pic TEXT DEFAULT ''`
- `created_at TIMESTAMP DEFAULT NOW()`

Runtime migration logic also:
- adds `company_id`, `role`, `manager_id`, `is_manager_approver` if missing
- drops legacy `country` and `base_currency` columns from users if present

### 3.3 `expenses`
- `id SERIAL PRIMARY KEY`
- `company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE`
- `submitted_by INTEGER REFERENCES users(id) ON DELETE CASCADE`
- `amount NUMERIC(12,2) NOT NULL`
- `currency VARCHAR(10) NOT NULL`
- `amount_in_base NUMERIC(12,2)`
- `category VARCHAR(100) NOT NULL`
- `description TEXT`
- `expense_date DATE NOT NULL`
- `receipt_url TEXT`
- `ocr_data JSONB`
- `status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','in_review'))`
- `current_step INTEGER DEFAULT 1`
- `created_at TIMESTAMP DEFAULT NOW()`

### 3.4 `approval_rules`
- `id SERIAL PRIMARY KEY`
- `company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE`
- `name VARCHAR(255) NOT NULL`
- `rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('sequential','percentage','specific_approver','hybrid'))`
- `percentage_threshold NUMERIC(5,2)`
- `specific_approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL`
- `created_at TIMESTAMP DEFAULT NOW()`

### 3.5 `approval_steps`
- `id SERIAL PRIMARY KEY`
- `rule_id INTEGER REFERENCES approval_rules(id) ON DELETE CASCADE`
- `step_order INTEGER NOT NULL`
- `approver_id INTEGER REFERENCES users(id) ON DELETE CASCADE`
- `approver_role VARCHAR(50)`
- `created_at TIMESTAMP DEFAULT NOW()`

### 3.6 `expense_approvals`
- `id SERIAL PRIMARY KEY`
- `expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE`
- `approver_id INTEGER REFERENCES users(id) ON DELETE CASCADE`
- `step_order INTEGER NOT NULL`
- `status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'))`
- `comment TEXT`
- `acted_at TIMESTAMP`
- `created_at TIMESTAMP DEFAULT NOW()`

### 3.7 Session table
- Session table is auto-managed by `connect-pg-simple` (`createTableIfMissing: true`).

---

## 4. Current Validation Rules Implemented

### Signup
- Name required, min 2 chars, letters-only style pattern (no numbers).
- Email required and validated.
- Password required, min 6.
- Confirm password required and must match.
- Country required.

### Login
- Email required and validated.
- Password required.

---

## 5. Current Implementation Summary

Implemented end-to-end:
- Session auth
- role-based authorization
- company/admin bootstrap via signup
- user administration
- expense submission and tracking
- configurable multi-step approval rules
- approval action workflow (approve/reject/override)
- dashboard and role-specific UI
- PostgreSQL schema initialization and migration helper logic

Known partial area:
- Chat module is present only as an unused scaffold and is not connected to active API flow.
