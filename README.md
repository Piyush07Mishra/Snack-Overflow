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
9. Shared branding with logo displayed across auth and dashboard pages.

## Latest Updates

1. Local receipt upload endpoint added and integrated with Submit Expense.
2. OCR extraction now auto-fills amount, date, and description.
3. Draft and submit actions are both available in Submit Expense.
4. Pending approvals supports inline approve/reject actions.
5. Global logo branding is applied in sidebar, sign-in, and sign-up pages.

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
| Create company via signup |  | ❌ | ❌ | ❌ |
| Manage users |  | ❌ | ❌ | ❌ |
| Create/delete rules |  | ❌ | ❌ | ❌ |
| View all company expenses |  | ❌ | ❌ | ❌ |
| Manager/director team views |  |  |  | ❌ |
| Approve/reject assigned expenses |  |  |  | ❌ |
| Submit expenses |  |  |  |  |
| Save draft expenses |  |  |  |  |
| Override final status |  | ❌ | ❌ | ❌ |

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

## Implementation Status

### Latest Upgrade Snapshot (March 2026)

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

## Backend Implementation

### App and Middleware
- Express server with JSON + URL-encoded body parsing.
- CORS configured for frontend origin `http://localhost:5173` with credentials.
- JWT-based authentication with token verification middleware.
- Environment variables used:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `PORT`

### Auth Module (`/api/auth`)
Implemented endpoints:
- `POST /signup`
- `POST /login`
- `GET /logout`
- `GET /me`
- `POST /forgot-password`
- `POST /send-password/:userId`

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
- JWT token returned on successful auth.

Implemented login behavior:
- Required email + password.
- Email format validation.
- Credential check with bcrypt compare.
- JWT token returned with user payload including company info.

### Auth/Role Guards
- `requireAuth`: blocks unauthenticated requests and attaches `req.user` with company info.
- `requireRole(...roles)`: role-based access control.

### User Management (`/api/users`) [admin only]
- `GET /` list users in company.
- `POST /` create employee/manager.
- `PUT /:id` update role/manager/isManagerApprover.
- `DELETE /:id` delete user in company.

Implemented constraints in controller:
- Create requires fullName, email, password, role.
- Allowed create roles: employee, manager.
- Duplicate email blocked.
- Password hashed with bcrypt.

### Expense Module (`/api/expenses`)
Implemented endpoints:
- `POST /` submit expense
- `POST /upload-receipt` local file upload
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

### Approval Rule Module (`/api/rules`)
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

### Manager/Director Module (`/api/manager`)
- `GET /team` - list team members for manager/director
- `GET /expenses` - list team expenses for manager/director

### Models Implemented
- `company.model.js`: create/findById.
- `user.model.js`: findByEmail/findById/create/findByCompany/update.
- `expense.model.js`: create/findByUser/findByCompany/findById/updateStatus/findPendingForApprover.
- `approvalRule.model.js`: create/addStep/findByCompany/findById/deleteById.

### Partial/Not Wired Items
- `chat.controller.js` exists but is empty.
- `chat.model.js` uses Mongoose schema and is not connected to active PostgreSQL flow.
- No chat routes are mounted in server.

## Frontend Implementation

### Routing and Auth State
- Route guards with `ProtectedRoute`.
- Role-based route restrictions.
- Auth state bootstrapped from `GET /auth/me`.
- Axios configured with JWT token in authorization header.
- JWT token stored in localStorage.

### Implemented Pages
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
  - local file upload with OCR extraction
  - draft and submit actions
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
  - inline approve/reject actions
- `Users` (admin):
  - create/edit/delete users
  - manager assignment and manager-approver toggle
- `ApprovalRules` (admin):
  - create/delete rules
  - percentage/specific approver/hybrid fields
  - dynamic multi-step builder
- `TeamMembers` (manager/director):
  - view team member list
- `TeamExpenses` (manager/director):
  - view team expense list

### Role Navigation Implemented in Sidebar
- Admin: dashboard, users, all expenses, approval rules.
- Manager: dashboard, team, team expenses, pending approvals, my expenses.
- Director: dashboard, team, team expenses, pending approvals, my expenses.
- Employee: dashboard, submit expense, my expenses.

## Database Schema

### `companies`
- `id SERIAL PRIMARY KEY`
- `name VARCHAR(255) NOT NULL`
- `country VARCHAR(100) NOT NULL`
- `base_currency VARCHAR(10) NOT NULL`
- `created_at TIMESTAMP DEFAULT NOW()`

### `users`
- `id SERIAL PRIMARY KEY`
- `company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE`
- `full_name VARCHAR(255) NOT NULL`
- `email VARCHAR(255) UNIQUE NOT NULL`
- `password VARCHAR(255) NOT NULL`
- `role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('admin','director','manager','employee'))`
- `manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL`
- `is_manager_approver BOOLEAN DEFAULT false`
- `profile_pic TEXT DEFAULT ''`
- `created_at TIMESTAMP DEFAULT NOW()`

### `expenses`
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
- `status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft','submitted','pending','in_review','approved','rejected'))`
- `current_step INTEGER DEFAULT 1`
- `created_at TIMESTAMP DEFAULT NOW()`

### `approval_rules`
- `id SERIAL PRIMARY KEY`
- `company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE`
- `name VARCHAR(255) NOT NULL`
- `rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('sequential','percentage','specific_approver','hybrid'))`
- `percentage_threshold NUMERIC(5,2)`
- `specific_approver_id INTEGER REFERENCES users(id) ON DELETE SET NULL`
- `created_at TIMESTAMP DEFAULT NOW()`

### `approval_steps`
- `id SERIAL PRIMARY KEY`
- `rule_id INTEGER REFERENCES approval_rules(id) ON DELETE CASCADE`
- `step_order INTEGER NOT NULL`
- `approver_id INTEGER REFERENCES users(id) ON DELETE CASCADE`
- `approver_role VARCHAR(50)`
- `created_at TIMESTAMP DEFAULT NOW()`

### `expense_approvals`
- `id SERIAL PRIMARY KEY`
- `expense_id INTEGER REFERENCES expenses(id) ON DELETE CASCADE`
- `approver_id INTEGER REFERENCES users(id) ON DELETE CASCADE`
- `step_order INTEGER NOT NULL`
- `status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected'))`
- `comment TEXT`
- `acted_at TIMESTAMP`
- `created_at TIMESTAMP DEFAULT NOW()`

## Validation Rules

### Signup
- Name required, min 2 chars, letters-only style pattern (no numbers).
- Email required and validated.
- Password required, min 6.
- Confirm password required and must match.
- Country required.

### Login
- Email required and validated.
- Password required.

## Development Roadmap

### Completed Upgrades

#### Phase 1: Security and Auth Foundation 
- Moved from session-first auth to JWT auth
- Added JWT verification middleware
- Added token-based frontend client state

#### Phase 2: Multi-tenant Isolation Hardening 
- Ensured sensitive queries are company-scoped
- Prevented cross-company access in detail/update/delete flows
- Completed for expense detail/action/override and approval-rule delete/read

#### Phase 3: Role Hierarchy Extension 
- Added `director` role support in schema and checks
- Enabled director as approver candidate in rules
- Exposed manager/director team endpoints

#### Phase 4: Validation Layer 
- Added `express-validator`
- Added centralized validation middleware
- Wired validators on auth/users/expenses/rules routes

#### Phase 5: Approval Engine Modularization 
- Extracted approval assignment + action progression into service
- Kept controller thin and orchestration-focused
- Implemented `approvalEngine.service.js`

#### Phase 6: Frontend Alignment 
- Store JWT token in localStorage
- Attach token via axios interceptor
- Updated login/signup flow to persist token
- Added manager pages for team and team expenses
- Added director navigation support

### Future Production Upgrades

#### Phase 7: Remaining Production Enhancements
- Move DB operations to repository/service layers uniformly
- Add dedicated `approvalEngine` tests
- Add receipt OCR parser integration (amount/date/vendor extraction)
- Add manager-team/company scoping assertions on every endpoint
- Add refresh token + token revocation strategy
- Add audit logs for approvals and admin overrides

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
