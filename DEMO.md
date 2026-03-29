# ReimburX — Demo Walkthrough

This guide walks through the full product end-to-end using three personas:
**Admin (Company Owner)**, **Manager**, and **Employee**.

---

## Setup Before Demo

Make sure both servers are running:

```bash
# Terminal 1 — Backend
cd backend && npm start

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Step 1 — Admin Signs Up (Company Creation)

> Persona: Sarah (Company Owner)

1. Land on the **Sign In** page → click **Signup**
2. Fill in the form:
   - Name: `Sarah Johnson`
   - Company Name: `Acme Corp`
   - Email: `sarah@acme.com`
   - Password: `acme123`
   - Country: `India`
3. Click **Signup**

**What happens behind the scenes:**
- A new `companies` row is created for Acme Corp
- Base currency is auto-fetched from restcountries API → set to `INR`
- Sarah is created as `role: admin`
- Session is started, redirected to **Dashboard**

**Dashboard shows:**
- Company name: Acme Corp
- Role: admin
- Stats: 0 total, 0 approved, 0 rejected, 0 pending

---

## Step 2 — Admin Creates Users

> Persona: Sarah (Admin)

Navigate to **Users** in the sidebar.

### Create a Manager

Click **+ Add User** and fill:
- Full Name: `Raj Mehta`
- Email: `raj@acme.com`
- Password: `raj123`
- Role: `manager`

Click **Create User**.

### Create an Employee

Click **+ Add User** again:
- Full Name: `Priya Sharma`
- Email: `priya@acme.com`
- Password: `priya123`
- Role: `employee`
- Assign Manager: `Raj Mehta`
- Check **Is Manager Approver** 

Click **Create User**.

**Users table now shows:**
| Name | Role | Manager | Mgr Approver |
|---|---|---|---|
| Sarah Johnson | admin | — | — |
| Raj Mehta | manager | — | — |
| Priya Sharma | employee | Raj Mehta | ✓ |

---

## Step 3 — Admin Creates an Approval Rule

Navigate to **Approval Rules** → click **+ New Rule**.

### Example: Sequential Rule (Finance → Director)

- Rule Name: `Finance Approval Chain`
- Rule Type: `sequential`
- Add Step 1 → Select `Raj Mehta`, Role label: `Finance Manager`
- Click **Create Rule**

### Example: Hybrid Rule (60% OR CFO auto-approves)

Click **+ New Rule** again:
- Rule Name: `Hybrid 60% or CFO`
- Rule Type: `hybrid`
- Threshold: `60`
- Specific Approver: `Sarah Johnson` (CFO)
- Add Step 1 → `Raj Mehta`
- Click **Create Rule**

---

## Step 4 — Employee Submits an Expense

> Persona: Priya (Employee)

Open a new browser tab (or incognito) → `http://localhost:5173/signin`

Login as:
- Email: `priya@acme.com`
- Password: `priya123`

Priya's sidebar shows: Dashboard, Submit Expense, My Expenses.

Navigate to **Submit Expense** and fill:
- Amount: `5000`
- Currency: `USD`
- Category: `Travel`
- Description: `Flight to Mumbai for client meeting`
- Date: `2026-03-25`
- Approval Rule: `Finance Approval Chain`

Click **Submit Expense**.

**What happens:**
- Amount `5000 USD` is converted to INR using live exchange rate → stored as `amount_in_base`
- Since Priya has `is_manager_approver = true` and `manager_id = Raj`, Raj is inserted as **Step 0** (first approver)
- Then the rule steps are added after
- Expense status → `in_review`
- Priya is redirected to **My Expenses**

**My Expenses shows:**
| Category | Amount | Base Amount | Status |
|---|---|---|---|
| Travel | USD 5000 | INR ~416,000 | in_review |

---

## Step 5 — Manager Reviews and Approves

> Persona: Raj (Manager)

Switch to Raj's browser tab (or open new incognito).

Login as:
- Email: `raj@acme.com`
- Password: `raj123`

Navigate to **Pending Approvals**.

**Table shows Priya's Travel expense waiting.**

Click **Review** → opens Expense Detail page.

**Expense Detail shows:**
- Amount: USD 5000 (INR ~416,000)
- Category: Travel
- Description: Flight to Mumbai for client meeting
- Approval Timeline: Step 0 — Raj Mehta → pending

Raj adds a comment: `Looks good, approved for travel.`

Clicks **Approve** 

**What happens:**
- `expense_approvals` row for Raj → status: `approved`
- Next pending step checked → if no more steps, expense → `approved`
- Priya's expense status updates to `approved`

---

## Step 6 — Employee Checks Status

Switch back to Priya's tab → **My Expenses**

| Category | Amount | Status |
|---|---|---|
| Travel | USD 5000 |  approved |

Click **View** → Approval Timeline shows:

```
● Raj Mehta — Step 0
  approved
  "Looks good, approved for travel."
  25/03/2026
```

---

## Step 7 — Rejection Flow

> Priya submits another expense

- Amount: `15000`
- Currency: `EUR`
- Category: `Accommodation`
- Description: `Hotel stay — Paris conference`
- Date: `2026-03-28`

Raj opens **Pending Approvals** → clicks **Review**

Adds comment: `Conference not pre-approved, please resubmit with approval form.`

Clicks **Reject** ❌

**Expense status → `rejected`**

Priya sees in **My Expenses**:
| Category | Amount | Status |
|---|---|---|
| Accommodation | EUR 15000 | ❌ rejected |

---

## Step 8 — Admin Override

> Persona: Sarah (Admin)

Navigate to **All Expenses** → filter by `rejected`.

Sarah sees Priya's hotel expense. She decides to override.

Clicks **Approve** next to the rejected expense.

**Expense status → `approved` (admin override)**

---

## Step 9 — Conditional Rule Demo (Hybrid)

> Priya submits a third expense using the Hybrid rule

- Amount: `2000`
- Currency: `GBP`
- Category: `Training`
- Approval Rule: `Hybrid 60% or CFO`

Since Sarah (CFO / specific approver) is in the rule — if Sarah approves, it auto-approves regardless of other steps.

Sarah logs in → **Pending Approvals** → approves it.

**Result:** Expense immediately moves to `approved` — the "specific approver" shortcut triggered.

---

## Summary of Flows Demonstrated

| Flow | Demonstrated |
|---|---|
| Company + Admin auto-created on signup |  Step 1 |
| Country → currency auto-set (INR for India) |  Step 1 |
| Admin creates manager and employee |  Step 2 |
| Manager relationship + is_manager_approver |  Step 2 |
| Sequential approval rule creation |  Step 3 |
| Hybrid rule (percentage + specific approver) |  Step 3 |
| Employee submits multi-currency expense |  Step 4 |
| Currency conversion (USD → INR) |  Step 4 |
| Manager-first approval (step 0) |  Step 5 |
| Approve with comment |  Step 5 |
| Employee views approval status + timeline |  Step 6 |
| Reject with comment |  Step 7 |
| Admin override (force approve) |  Step 8 |
| Specific approver auto-approval (hybrid rule) |  Step 9 |
