# Reimbursement System Final E2E Test Plan

This checklist is aligned to the current codebase and should be used as the final manual QA pass.

## 1. Environment Setup

1. Ensure PostgreSQL is running.
2. Configure backend env in backend/.env with at least:
- DATABASE_URL
- SESSION_SECRET
- JWT_SECRET (recommended)
- PORT=5001
3. Install dependencies:
- npm --prefix backend install
- npm --prefix frontend install
4. Start services:
- npm --prefix backend start
- npm --prefix frontend run dev
5. Open application:
- http://localhost:5173

Expected:

1. Backend starts without schema errors.
2. Frontend loads sign in page.

## 2. Authentication and Validation

### 2.1 Signup (first admin + company creation)

1. Go to signup.
2. Create Company A admin:
- Name: Alpha Admin
- Company: Alpha Corp
- Country: India
- Email: admin.alpha@mail.com
- Password: Admin@123
- Confirm Password: Admin@123

Expected:

1. Signup success.
2. Redirect to dashboard.
3. Company is created.
4. JWT token is saved in localStorage auth_token.
5. Base currency is set from country.

### 2.2 Signup invalid data checks

Attempt and verify failure messages:

1. Name containing digits.
2. Invalid email format.
3. Password shorter than 6.
4. Password mismatch.

### 2.3 Login and session checks

1. Logout.
2. Login with valid admin credentials.
3. Open protected page directly via URL.

Expected:

1. Login succeeds with token.
2. Protected pages remain accessible while token exists.
3. After manual token removal, protected pages redirect/deny.

## 3. Admin User Management

Login as Company A admin and open Users page.

### 3.1 Create users with optional password generation

Create users:

1. Director with manual password.
2. Manager with manual password.
3. Employee with manager assignment and Is Manager Approver checked.
4. Employee with auto-generated password enabled.

Expected:

1. Users are created within Company A only.
2. Auto-generated password flow shows success and sends usable credentials.
3. Employee manager assignment persists.
4. Invalid manager assignment is rejected.

### 3.2 Edit users

1. Change employee role to manager, then back to employee.
2. Assign and unassign manager.
3. Toggle Is Manager Approver.

Expected:

1. Role updates persist.
2. Manager field is enforced only where valid.
3. Manager self-assignment is rejected.

### 3.3 Send password and delete

1. Use Send Password on a non-admin user.
2. Delete a test employee.

Expected:

1. Password send endpoint succeeds for same-company users.
2. Deletion removes user from list.

## 4. Approval Rules

As Company A admin, open Approval Rules.

Create at least two rules:

1. Rule A:
- managerApprovalRequired true
- sequentialApproval true
- explicit step chain manager -> director

2. Rule B:
- managerApprovalRequired true
- minApprovalsPercentage 60
- autoApproveRole director (or specificApproverId)

Expected:

1. Rules save and appear in list.
2. Steps render correctly.
3. Rule delete works.

## 5. Expense Submission Lifecycle

Login as employee.

### 5.1 Save draft

1. Open Submit Expense.
2. Fill required fields.
3. Click Save as Draft.

Expected:

1. Expense appears in My Expenses with draft status.
2. Draft is visible in admin All Expenses filters.

### 5.2 Submit expense

1. Create another expense and click Submit Expense.
2. Select an approval rule.

Expected:

1. Expense is created with submitted/in_review progression.
2. amount_in_base is computed.
3. Expense appears in manager/admin queues based on role.

## 6. Local Upload + OCR Flow

Login as employee and go to Submit Expense.

### 6.1 Local receipt upload

1. Choose an image file.
2. Click Upload to Server.

Expected:

1. Upload succeeds.
2. Receipt URL is returned and auto-filled in Receipt URL input.
3. Returned URL is reachable under /uploads/receipts.

### 6.2 OCR extraction

1. Click Extract Data.
2. Wait for OCR progress completion.

Expected:

1. Amount, date, and description auto-fill from OCR text.
2. User can edit values before submit.

### 6.3 Upload validation checks

1. Try unsupported file type.
2. Try file > 5MB.

Expected:

1. Request is rejected with proper error.

## 7. Manager and Director Approval Flow

### 7.1 Manager inline action

Login as manager and open Pending Approvals.

1. Approve one expense using inline Approve.
2. Reject another expense using inline Reject with comment.

Expected:

1. Approve moves expense forward or finishes approval depending on rule.
2. Reject sets final rejected and closes remaining pending steps.

### 7.2 Director/admin action

Login as director or admin:

1. Act on assigned pending approvals.
2. Validate sequential constraints by trying out-of-order action (if applicable).

Expected:

1. Only valid pending step can be acted on for sequential rules.
2. Auto-approve role or specific approver logic finalizes expense where configured.

## 8. Admin Expense Oversight

As admin:

1. Open All Expenses.
2. Filter by draft, submitted, pending, in_review, approved, rejected.
3. Use override on pending/in_review/rejected.

Expected:

1. Filters return matching records.
2. Override updates final status immediately.

## 9. Team Views

As manager/director/admin:

1. Open My Team.
2. Open Team Expenses.

Expected:

1. Team list is scoped correctly.
2. Team expenses are scoped to team membership.

## 10. Multi-Tenant Isolation (Critical)

Create Company B with separate admin and employee.

With Company A credentials, verify:

1. Cannot see Company B users.
2. Cannot see Company B expenses.
3. Cannot open Company B expense detail.
4. Cannot mutate Company B users/rules/expenses.

With Company B credentials, verify symmetric isolation.

Expected:

1. Zero cross-company read/write leakage.

## 11. API Smoke Checklist

Auth:

1. POST /api/auth/signup
2. POST /api/auth/login
3. GET /api/auth/me
4. POST /api/auth/forgot-password
5. POST /api/auth/send-password/:userId

Users:

1. GET /api/users
2. POST /api/users
3. PUT /api/users/:id
4. DELETE /api/users/:id

Rules:

1. GET /api/rules
2. POST /api/rules
3. DELETE /api/rules/:id
4. GET /api/rules/managers

Expenses:

1. POST /api/expenses
2. POST /api/expenses/upload-receipt
3. GET /api/expenses/my
4. GET /api/expenses/all
5. GET /api/expenses/pending
6. GET /api/expenses/:id
7. POST /api/expenses/:id/action
8. POST /api/expenses/:id/override

Manager module:

1. GET /api/manager/team
2. GET /api/manager/expenses

## 12. Final Pass Criteria

Mark QA pass only if all are true:

1. Auth and validation behave correctly.
2. Role-based access is enforced for all major routes.
3. Rule engine supports sequential and conditional approvals as configured.
4. Draft/submitted/in_review/approved/rejected lifecycle is consistent in UI and API.
5. Local upload + OCR autofill flow works end-to-end.
6. Admin user management features work with proper guardrails.
7. Tenant isolation is fully preserved.
8. Frontend build succeeds and backend runs without migration/runtime errors.

## 13. Recommended Automation Next

1. Add backend integration tests for auth, expenses, and tenant isolation.
2. Add API tests for upload endpoint constraints.
3. Add frontend tests for Submit Expense OCR and draft/submit actions.
