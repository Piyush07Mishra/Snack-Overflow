# ReimburX

Production-style reimbursement management platform with multi-tenant isolation, role-based approvals, draft lifecycle, and OCR-assisted receipt processing.

## Core Features

1. Multi-tenant data isolation by company.
2. JWT-based authentication and protected APIs.
3. Role model: admin, director, manager, employee.
4. Approval rules with sequential, percentage, specific approver, and hybrid behavior.
5. Draft and submitted expense lifecycle.
6. Local receipt upload to server storage.
7. Frontend OCR using Tesseract.js with form autofill (amount, date, description).
8. Currency conversion to company base currency.

## Quick Start

### 1) Requirements

1. Node.js 18+
2. PostgreSQL

### 2) Configure backend env

Create backend/.env with:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
SESSION_SECRET=replace-with-strong-secret
JWT_SECRET=replace-with-jwt-secret
PORT=5001

# Optional email settings (used by forgot password/send password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

Notes:

1. JWT_SECRET is recommended.
2. If JWT_SECRET is missing, SESSION_SECRET is used as fallback.

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

1. Frontend: http://localhost:5173
2. Backend API: http://localhost:5001/api
3. Uploaded files base path: http://localhost:5001/uploads

## Expense + OCR + Upload Flow

Submit Expense page supports the following sequence:

1. Select receipt image.
2. Upload to local server using Upload to Server button.
3. Extract data with OCR using Extract Data button.
4. Form auto-fills amount, expense date, and description.
5. User reviews/edits values.
6. User can Submit Expense or Save as Draft.

Upload details:

1. Endpoint: POST /api/expenses/upload-receipt
2. Field name: receipt
3. Allowed formats: jpg, jpeg, png, webp
4. Max file size: 5MB
5. Storage path: backend/uploads/receipts

## Role Capabilities

| Capability | Admin | Director | Manager | Employee |
|---|:---:|:---:|:---:|:---:|
| Create company via signup | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Create/delete rules | ✅ | ❌ | ❌ | ❌ |
| View all company expenses | ✅ | ❌ | ❌ | ❌ |
| Manager/director team views | ✅ | ✅ | ✅ | ❌ |
| Approve/reject assigned expenses | ✅ | ✅ | ✅ | ❌ |
| Submit expenses | ✅ | ✅ | ✅ | ✅ |
| Save draft expenses | ✅ | ✅ | ✅ | ✅ |
| Override final status | ✅ | ❌ | ❌ | ❌ |

## API Map

### Auth

1. POST /api/auth/signup
2. POST /api/auth/login
3. GET /api/auth/me
4. GET /api/auth/logout
5. POST /api/auth/forgot-password
6. POST /api/auth/send-password/:userId

### Users (admin)

1. GET /api/users
2. POST /api/users
3. PUT /api/users/:id
4. DELETE /api/users/:id

### Rules

1. GET /api/rules
2. POST /api/rules
3. DELETE /api/rules/:id
4. GET /api/rules/managers

### Expenses

1. POST /api/expenses
2. POST /api/expenses/upload-receipt
3. GET /api/expenses/my
4. GET /api/expenses/all
5. GET /api/expenses/pending
6. GET /api/expenses/:id
7. POST /api/expenses/:id/action
8. POST /api/expenses/:id/override

### Manager/Director Module

1. GET /api/manager/team
2. GET /api/manager/expenses

## High-Level Data Model

Main tables:

1. companies
2. users
3. expenses
4. approval_rules
5. approval_steps
6. expense_approvals

Important fields:

1. users.role: admin, director, manager, employee
2. users.company_id and expenses.company_id for tenant scope
3. expenses.status: draft, submitted, pending, in_review, approved, rejected
4. approval rules support manager requirement, sequence toggle, min approval percentage, auto-approve role, specific approver

## Manual Test Guide

Use the full checklist in [test.md](test.md).

It includes:

1. Auth and validation checks
2. User and rule setup
3. Approval lifecycle and overrides
4. Multi-tenant isolation tests
5. API smoke checks

## Project Structure

```text
backend/
  index.js
  uploads/
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
