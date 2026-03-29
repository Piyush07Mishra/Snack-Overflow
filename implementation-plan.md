# Reimbursement System Upgrade Plan

This plan compares current implementation vs target SaaS architecture and defines step-by-step execution.

## Phase 1: Security and auth foundation
1. Move from session-first auth to JWT auth.
2. Add JWT verification middleware.
3. Add token-based frontend client state.

Status: Completed

## Phase 2: Multi-tenant isolation hardening
1. Ensure sensitive queries are company-scoped.
2. Prevent cross-company access in detail/update/delete flows.

Status: Completed for expense detail/action/override and approval-rule delete/read; ongoing for remaining routes as future hardening.

## Phase 3: Role hierarchy extension
1. Add `director` role support in schema and checks.
2. Enable director as approver candidate in rules.
3. Expose manager/director team endpoints.

Status: Completed

## Phase 4: Validation layer
1. Add `express-validator`.
2. Add centralized validation middleware.
3. Wire validators on auth/users/expenses/rules routes.

Status: Completed

## Phase 5: Approval engine modularization
1. Extract approval assignment + action progression into service.
2. Keep controller thin and orchestration-focused.

Status: Completed (`approvalEngine.service.js`)

## Phase 6: Frontend alignment
1. Store JWT token in localStorage.
2. Attach token via axios interceptor.
3. Update login/signup flow to persist token.
4. Add manager pages for team and team expenses.
5. Add director navigation support.

Status: Completed

## Phase 7: Remaining production upgrades (next)
1. Move DB operations to repository/service layers uniformly.
2. Add dedicated `approvalEngine` tests.
3. Add receipt OCR parser integration (amount/date/vendor extraction).
4. Add manager-team/company scoping assertions on every endpoint.
5. Add refresh token + token revocation strategy.
6. Add audit logs for approvals and admin overrides.

Status: Not started
