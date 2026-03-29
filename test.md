# Reimbursement System E2E Test Flow

This document is for manual end-to-end testing of what is currently implemented.

## 1. Pre-check

1. Make sure PostgreSQL is running.
2. Backend env should be set in backend/.env:
- DATABASE_URL
- SESSION_SECRET (also used as JWT secret fallback)
- PORT=5001
3. Install dependencies:
- npm --prefix backend install
- npm --prefix frontend install
4. Run apps:
- npm --prefix backend start
- npm --prefix frontend run dev
5. Open app:
- http://localhost:5173

## 2. Dummy Users and Companies

Use these test identities.

Company A:
- Admin: admin.alpha@mail.com / Admin@123
- Director: dia.alpha@mail.com / Dir@12345
- Manager: man.alpha@mail.com / Man@12345
- Employee 1: emp1.alpha@mail.com / Emp@12345
- Employee 2: emp2.alpha@mail.com / Emp@12345

Company B (tenant isolation test):
- Admin: admin.beta@mail.com / Admin@123
- Employee: emp.beta@mail.com / Emp@12345

## 3. Auth and Company Creation

### 3.1 Admin signup (Company A)

UI path:
1. Go to signup page.
2. Fill:
- Name: Alpha Admin
- Company Name: Alpha Corp
- Country: India
- Email: admin.alpha@mail.com
- Password: Admin@123
- Confirm Password: Admin@123
3. Submit.

Expected:
1. Account created.
2. Redirect to dashboard.
3. JWT token stored in browser localStorage key auth_token.
4. Company auto-created.
5. Base currency should be INR for India.

### 3.2 Invalid form checks

Try and confirm validation errors:
1. Name with number (Alpha1) should fail.
2. Invalid email (alpha@mail123) should fail.
3. Password shorter than 6 should fail.
4. Password mismatch should fail.

### 3.3 Login and me endpoint

1. Logout.
2. Login using admin.alpha@mail.com / Admin@123.
3. Verify dashboard loads.

Optional API check:
1. POST /api/auth/login should return token.
2. GET /api/auth/me with Authorization Bearer token should return 200.
3. GET /api/auth/me without token should return 401.

## 4. Admin User Management

Login as Company A admin.

### 4.1 Create users

Go to Users page and create:
1. Director:
- fullName: Dia Director
- email: dia.alpha@mail.com
- role: director
- password: Dir@12345

2. Manager:
- fullName: Mark Manager
- email: man.alpha@mail.com
- role: manager
- password: Man@12345

3. Employee 1:
- fullName: Sarah Employee
- email: emp1.alpha@mail.com
- role: employee
- password: Emp@12345
- assign manager: Mark Manager
- is manager approver: true

4. Employee 2:
- fullName: Evan Employee
- email: emp2.alpha@mail.com
- role: employee
- password: Emp@12345
- assign manager: Mark Manager

Expected:
1. Users list shows all users in same company.
2. Roles are visible and editable.
3. Manager mapping saved.

### 4.2 Role update and delete

1. Edit Employee 2 role to manager then back to employee.
2. Delete Employee 2.

Expected:
1. Updates persist.
2. Delete removes user.
3. Admin user cannot be accidentally removed from UI action flow.

## 5. Approval Rules

As Company A admin, go to Approval Rules.

Create rules:
1. Sequential Rule:
- name: Seq Approval
- ruleType: sequential
- steps: manager then director

2. Percentage Rule:
- name: Pct 60
- ruleType: percentage
- threshold: 60
- add at least two approver steps

3. Specific Approver Rule:
- name: Director Override
- ruleType: specific_approver
- specificApproverId: Dia Director

4. Hybrid Rule:
- name: Hybrid 60 or Director
- ruleType: hybrid
- threshold: 60
- specificApproverId: Dia Director
- add steps

Expected:
1. Rule list shows each rule with its steps.
2. Delete rule works.

## 6. Employee Expense Submission

Login as Employee 1 (emp1.alpha@mail.com / Emp@12345).

1. Go to Submit Expense.
2. Submit expense:
- amount: 100
- currency: USD
- category: Travel
- description: Taxi and meals
- expenseDate: today
- select rule: Seq Approval

Expected:
1. Expense created.
2. In My Expenses, record appears.
3. amount_in_base should be populated (converted value in company currency).
4. Status should be in_review or pending depending on queue.

## 7. Approval Flow (Sequential)

### 7.1 Manager action

Login as manager (man.alpha@mail.com / Man@12345).

1. Open Pending Approvals.
2. Open submitted expense.
3. Add comment and approve.

Expected:
1. Step updates to approved for manager.
2. Expense moves to next step (director) and remains in_review.

### 7.2 Director action

Login as director (dia.alpha@mail.com / Dir@12345).

1. Open Pending Approvals.
2. Approve same expense.

Expected:
1. Final expense status becomes approved.
2. Timeline shows both actions with timestamps and comments.

## 8. Reject and Override Flow

### 8.1 Reject

1. Submit one more expense as Employee 1.
2. Manager rejects with comment.

Expected:
1. Expense status becomes rejected.
2. Remaining pending approvals are closed as rejected.

### 8.2 Admin override

Login as admin.

1. Open All Expenses.
2. Filter rejected.
3. Override rejected expense to approved.

Expected:
1. Status updates to approved.
2. Change visible in expense detail.

## 9. Manager Module Pages

Login as manager.

1. Open My Team page.
2. Open Team Expenses page.

Expected:
1. My Team shows users assigned to manager.
2. Team Expenses shows expenses submitted by manager's team only.

## 10. Multi-tenant Isolation (Critical)

### 10.1 Setup Company B

1. Signup new admin:
- Name: Beta Admin
- Company: Beta Corp
- Country: United States
- Email: admin.beta@mail.com
- Password: Admin@123
2. Create Beta employee: emp.beta@mail.com.
3. Submit one expense in Company B.

### 10.2 Isolation checks

With Company A admin token/session:
1. Users page must not show any Beta user.
2. All Expenses must not show Beta expense.
3. Expense detail by trying Beta expense id should return not found/forbidden.
4. Rule delete/read should not affect Company B rules.

With Company B admin:
1. Must only see Beta data.

Expected:
1. No cross-company data visibility or mutation.

## 11. API Quick Smoke (Optional)

Use curl or Postman.

1. Auth:
- POST /api/auth/signup
- POST /api/auth/login
- GET /api/auth/me

2. Users:
- GET /api/users
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id

3. Rules:
- GET /api/rules
- POST /api/rules
- DELETE /api/rules/:id
- GET /api/rules/managers

4. Expenses:
- POST /api/expenses
- GET /api/expenses/my
- GET /api/expenses/all
- GET /api/expenses/pending
- GET /api/expenses/:id
- POST /api/expenses/:id/action
- POST /api/expenses/:id/override

5. Manager:
- GET /api/manager/team
- GET /api/manager/expenses

## 12. Pass Criteria

Mark build as pass if all are true:
1. JWT auth works (token issued, me endpoint protected).
2. Validation works for name/email/password.
3. Company auto-create and country currency mapping works.
4. Role-based access works for admin/manager/director/employee.
5. Approval engine works for sequential, percentage, specific, hybrid.
6. Currency conversion value is stored.
7. Manager pages show only team scoped data.
8. Multi-tenant isolation is enforced (no cross-company leakage).

## 13. Known Follow-up Items (if you observe failures)

1. Any endpoint returning data without company filter must be fixed immediately.
2. If approval rule selection is ambiguous, map expense to explicit rule id for action processing.
3. Add automated integration tests later (supertest + seeded DB) based on this checklist.
