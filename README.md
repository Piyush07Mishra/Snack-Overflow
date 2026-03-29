# ReimburX

Production-style Reimbursement Management System with:
- Multi-tenant company isolation
- JWT authentication
- Role-based workflows (admin, director, manager, employee)
- Multi-level and conditional approval engine
- Currency-aware expense submission

---

## Quick Start

### 1) Requirements
- Node.js 18+
- PostgreSQL

### 2) Configure backend env
Create backend/.env

```env
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
SESSION_SECRET=replace-with-strong-secret
JWT_SECRET=replace-with-jwt-secret
PORT=5001
```

Notes:
- JWT_SECRET is recommended.
- If JWT_SECRET is missing, backend falls back to SESSION_SECRET.

### 3) Install dependencies

```bash
npm --prefix backend install
npm --prefix frontend install
```

### 4) Run app

```bash
npm --prefix backend start
npm --prefix frontend run dev
```

URLs:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/api

---

## Demo Accounts (Suggested)

Use these when testing manually:

Company Alpha:
- Admin: admin.alpha@mail.com / Admin@123
- Director: dia.alpha@mail.com / Dir@12345
- Manager: man.alpha@mail.com / Man@12345
- Employee: emp1.alpha@mail.com / Emp@12345

Company Beta (tenant isolation test):
- Admin: admin.beta@mail.com / Admin@123
- Employee: emp.beta@mail.com / Emp@12345

---

## What Is Implemented

### Authentication
- Signup creates company + first admin.
- Login returns JWT.
- Frontend stores token in localStorage and sends Bearer token automatically.
- Auth guard protects APIs.

### Multi-tenant model
- Every company has isolated users, expenses, and rules.
- Company scoping is enforced in critical expense and approval paths.

### Roles
- Admin: user management, all expenses, rules, override.
- Director: high-level approver and team views.
- Manager: pending approvals + team views.
- Employee: submit and track own expenses.

### Approval engine
- Sequential approvals
- Percentage rule
- Specific approver rule
- Hybrid rule
- Manager-first option for employees

### Currency system
- Country -> currency detection on signup
- Expense conversion to company currency during submission

---

## Role Capabilities

| Capability | Admin | Director | Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| Create company (signup) | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Create approval rules | ✅ | ❌ | ❌ | ❌ |
| View all company expenses | ✅ | ❌ | ❌ | ❌ |
| View manager team | ✅ | ✅ | ✅ | ❌ |
| View team expenses | ✅ | ✅ | ✅ | ❌ |
| Approve/reject assigned expenses | ✅ | ✅ | ✅ | ❌ |
| Submit expenses | ✅ | ✅ | ✅ | ✅ |
| View own expenses | ✅ | ✅ | ✅ | ✅ |
| Override final status | ✅ | ❌ | ❌ | ❌ |

---

## Main API Map

### Auth
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me
- GET /api/auth/logout

### Users (admin)
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

### Rules
- GET /api/rules
- POST /api/rules
- DELETE /api/rules/:id
- GET /api/rules/managers

### Expenses
- POST /api/expenses
- GET /api/expenses/my
- GET /api/expenses/all
- GET /api/expenses/pending
- GET /api/expenses/:id
- POST /api/expenses/:id/action
- POST /api/expenses/:id/override

### Manager/Director module
- GET /api/manager/team
- GET /api/manager/expenses

---

## Project Structure

```text
backend/
  index.js
  src/
    controllers/
    middlewares/
    models/
    routes/
    services/
    validators/
    lib/db.js

frontend/
  src/
    Pages/
    components/
    context/
    api/
```

---

## Database (High-level)

Tables:
- companies
- users
- expenses
- approval_rules
- approval_steps
- expense_approvals

Important fields:
- users.role includes admin, director, manager, employee
- users.company_id anchors tenancy
- expenses.company_id anchors tenancy
- expense_approvals.step_order drives flow progression

---

## Testing Guide

Use the complete manual end-to-end checklist in:
- test.md

It includes:
- Signup/login validation checks
- User and rule setup
- Full approval lifecycle
- Tenant isolation checks
- API smoke checklist

---

## Notes

- Chat files exist in repository but are not part of active API flow.
- OCR extraction pipeline is not fully wired yet (receipt URL is supported).
