# ReimburX

A full-stack Reimbursement Management System that streamlines expense submission, multi-level approvals, and conditional approval workflows for companies.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Role Permissions](#role-permissions)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [External APIs](#external-apis)

---

## Overview

ReimburX solves the problem of manual, error-prone expense reimbursement processes. It provides:

- Auto-created company and admin on first signup
- Role-based access for Admin, Manager, and Employee
- Multi-step sequential approval workflows
- Conditional approval rules (percentage, specific approver, hybrid)
- Real-time currency conversion for multi-currency expenses

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| express | ^5.1.0 | Web framework |
| pg | ^8.20.0 | PostgreSQL client |
| express-session | ^1.18.1 | Session management |
| connect-pg-simple | ^10.0.0 | PostgreSQL session store |
| bcrypt | ^6.0.0 | Password hashing |
| axios | ^1.14.0 | HTTP client (currency/country APIs) |
| cors | ^2.8.5 | Cross-origin resource sharing |
| dotenv | ^16.5.0 | Environment variable loading |
| nodemon | ^3.1.10 | Dev auto-restart |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| react | ^19.1.0 | UI library |
| react-router-dom | ^7.6.2 | Client-side routing |
| axios | ^1.9.0 | API calls |
| tailwindcss | ^3.4.17 | Utility-first CSS |
| react-toastify | ^11.0.5 | Toast notifications |
| vite | ^6.3.5 | Build tool & dev server |

---

## Project Structure

```
ReimburX/
├── README.md
│
├── backend/
│   ├── .env                          # Environment variables
│   ├── index.js                      # Express app entry point
│   ├── package.json
│   └── src/
│       ├── controllers/
│       │   ├── auth.controller.js        # Signup, login, logout, getMe
│       │   ├── user.controller.js        # CRUD for users (admin only)
│       │   ├── expense.controller.js     # Submit, fetch, approve/reject expenses
│       │   └── approvalRule.controller.js# Approval rule CRUD + managers list
│       ├── lib/
│       │   └── db.js                     # PostgreSQL pool + table initialization
│       ├── middlewares/
│       │   └── auth.middleware.js        # requireAuth, requireRole guards
│       ├── models/
│       │   ├── company.model.js          # Company queries
│       │   ├── user.model.js             # User queries
│       │   ├── expense.model.js          # Expense queries
│       │   └── approvalRule.model.js     # Approval rule + steps queries
│       └── routes/
│           ├── auth.route.js             # /api/auth
│           ├── user.route.js             # /api/users
│           ├── expense.route.js          # /api/expenses
│           └── approvalRule.route.js     # /api/rules
│
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx                      # App entry — BrowserRouter + AuthProvider
        ├── App.jsx                       # Route definitions
        ├── index.css                     # Global styles
        ├── api/
        │   └── axios.js                  # Axios instance (baseURL + credentials)
        ├── context/
        │   └── AuthContext.jsx           # Auth state, login/logout helpers
        ├── components/
        │   ├── Layout.jsx                # Sidebar + main layout wrapper
        │   └── ProtectedRoute.jsx        # Route guard by auth + role
        ├── data/
        │   └── countries.js              # Static country list fallback
        └── Pages/
            ├── SignIn.jsx                # Login page
            ├── SignUp.jsx                # Admin company signup page
            ├── Dashboard.jsx             # Role-aware stats + recent expenses
            ├── SubmitExpense.jsx         # Employee expense submission form
            ├── MyExpenses.jsx            # Employee expense history
            ├── AllExpenses.jsx           # Admin — all company expenses + override
            ├── ExpenseDetail.jsx         # Expense detail + approval timeline + action
            ├── PendingApprovals.jsx      # Manager/Admin pending approval queue
            ├── Users.jsx                 # Admin user management (create/edit/delete)
            └── ApprovalRules.jsx         # Admin approval rule builder
```

---

## Features

### Authentication & User Management
- **Admin signup** auto-creates a Company and sets the base currency from the selected country
- Admin can **create employees and managers** with email/password
- Admin can **assign roles** (employee, manager) and **change them** at any time
- Admin can **define manager relationships** — assign a manager to any employee
- `Is Manager Approver` flag — when enabled, the employee's manager is always the first approver

### Expense Submission (Employee)
- Submit expenses with: Amount, Currency (can differ from company currency), Category, Description, Date, Receipt URL
- Amount is **auto-converted** to the company's base currency using live exchange rates
- View full expense history with status (pending, in_review, approved, rejected)

### Approval Workflow
- On submission, an **approval queue** is built based on the selected rule + manager-first setting
- Expense moves to the **next approver only after** the current one acts (sequential)
- Managers see only expenses **assigned to them** in their pending queue
- Approve or Reject with optional comments
- Full **approval timeline** visible on expense detail page

### Conditional Approval Rules (Admin configurable)
| Rule Type | Behaviour |
|---|---|
| sequential | Each approver acts in order; all must approve |
| percentage | If X% of approvers approve → auto-approved |
| specific_approver | If a designated person approves → auto-approved |
| hybrid | Percentage threshold OR specific approver — whichever triggers first |

Rules can be combined with sequential steps (e.g. Step 1 → Manager, Step 2 → Finance, with 60% threshold).

### Admin Controls
- View **all company expenses** with status filters
- **Override** any expense (approve or reject directly)
- Manage all users, roles, and manager assignments
- Configure and delete approval rules

---

## Database Schema

```
companies
  id, name, country, base_currency, created_at

users
  id, company_id → companies, full_name, email, password,
  role (admin|manager|employee), manager_id → users,
  is_manager_approver, profile_pic, created_at

expenses
  id, company_id → companies, submitted_by → users,
  amount, currency, amount_in_base, category, description,
  expense_date, receipt_url, ocr_data (JSONB),
  status (pending|in_review|approved|rejected),
  current_step, created_at

approval_rules
  id, company_id → companies, name,
  rule_type (sequential|percentage|specific_approver|hybrid),
  percentage_threshold, specific_approver_id → users, created_at

approval_steps
  id, rule_id → approval_rules, step_order,
  approver_id → users, approver_role, created_at

expense_approvals
  id, expense_id → expenses, approver_id → users,
  step_order, status (pending|approved|rejected),
  comment, acted_at, created_at

session (auto-created by connect-pg-simple)
```

---

## API Reference

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/signup` | Public | Create company + admin user |
| POST | `/login` | Public | Login, returns user + session |
| GET | `/logout` | Auth | Destroy session |
| GET | `/me` | Auth | Get current user |

### Users — `/api/users`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | List all company users |
| POST | `/` | Admin | Create employee or manager |
| PUT | `/:id` | Admin | Update role / manager / approver flag |
| DELETE | `/:id` | Admin | Delete user |

### Expenses — `/api/expenses`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Auth | Submit new expense |
| GET | `/my` | Auth | Get own expenses |
| GET | `/all` | Admin | Get all company expenses |
| GET | `/pending` | Admin, Manager | Get expenses pending your approval |
| GET | `/:id` | Auth | Get expense detail + approval timeline |
| POST | `/:id/action` | Admin, Manager | Approve or reject with comment |
| POST | `/:id/override` | Admin | Force approve or reject |

### Approval Rules — `/api/rules`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Admin | List all rules |
| POST | `/` | Admin | Create rule with steps |
| DELETE | `/:id` | Admin | Delete rule |
| GET | `/managers` | Auth | List managers/admins (for rule builder) |

---

## Role Permissions

| Feature | Admin | Manager | Employee |
|---|:---:|:---:|:---:|
| Create company (auto on signup) | ✅ | — | — |
| Manage users & roles | ✅ | — | — |
| Configure approval rules | ✅ | — | — |
| View all company expenses | ✅ | — | — |
| Override approvals | ✅ | — | — |
| Approve / Reject expenses | ✅ | ✅ | — |
| View pending approvals | ✅ | ✅ | — |
| Submit expenses | ✅ | ✅ | ✅ |
| View own expenses | ✅ | ✅ | ✅ |

---

## Getting Started

### Prerequisites
- Node.js >= 18
- PostgreSQL running locally (or a remote connection string)

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

Create `backend/.env` (see [Environment Variables](#environment-variables) below).

### 3. Run

```bash
# Backend (from /backend)
npm start          # runs on http://localhost:5001

# Frontend (from /frontend)
npm run dev        # runs on http://localhost:5173
```

Tables are **auto-created** on first backend start. No migrations to run manually.

### 4. First use

1. Open `http://localhost:5173`
2. Click **Signup** — enter your name, company name, email, password, and country
3. Your company is created with the country's base currency set automatically
4. You're logged in as **Admin** — go to **Users** to create employees and managers

---

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/yourdbname
SESSION_SECRET=your_secret_key_here
PORT=5001
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret key for signing session cookies |
| `PORT` | Port the backend server listens on |

---

## External APIs

| API | Usage | Endpoint |
|---|---|---|
| REST Countries | Fetch country → currency mapping on signup | `https://restcountries.com/v3.1/all?fields=name,currencies` |
| ExchangeRate API | Convert expense currency to company base currency | `https://api.exchangerate-api.com/v4/latest/{BASE_CURRENCY}` |

Both are called server-side. No API keys required for these free tiers.
