# HelioPay System

A web-based School Payment Recording System for private primary and secondary schools in Africa, optimized for desktop use by school accountants.

## Architecture

- **Frontend**: React + Vite, Shadcn UI, TanStack Query, Wouter routing
- **Backend**: Express.js, Drizzle ORM, PostgreSQL
- **Auth**: Replit Auth (sessions/users tables) with RBAC (Admin/Bursar/Principal/Suspended roles)
- **Styling**: Tailwind CSS with dark mode support

## Key Features

- **RBAC**: Admin (full access), Bursar (Students, Payments, Expenses, Staff, Payroll, Reports, Budget, Verify Receipt), Principal (view-only: Dashboard, Students, Payments, Staff, Verify Receipt)
- Student CRUD management with class levels: Senior 1–4
- Payment recording by term (Term 1/2/3) and fee type (Tuition, Admission, Uniform, Boarding, SSCSE for Senior 4 only)
- Auto-generated receipt numbers, printable receipts, PDF generation (jspdf, client-side)
- Receipt verification page (public, no auth required)
- Expense recording by category with term association
- Staff management with two tabs: Teaching Staff and Non-Teaching Staff
- Teacher salary breakdown: base + accommodation + transport + other allowances - deductions
- Payroll generation from active teachers, approval workflow (Draft → Approved/Rejected)
- **Financial Management Suite**:
  - Reports page: Weekly/Monthly/Termly financial summaries with PDF export
  - Budget tracking: Set term budgets by category, view budget vs actual comparison with variance
  - Term Financial Health: Revenue - Expenses = Net Profit displayed on Dashboard (Admin/Principal)
- Settings page: School Branding (name, address, logo) — appears in all PDF headers
- User management (admin only): view all users, change roles
- Dashboard with charts, financial metrics, and Term Financial Health snapshot
- Multi-currency support: UGX and USD

## Database Tables

- `users` — Replit Auth users with role column (Admin/Bursar/Principal/Suspended)
- `sessions` — Replit Auth sessions
- `students` — Student records
- `payments` — Payment records with receipt numbers
- `expenses` — Expense records
- `teachers` — Teaching staff with salary breakdown
- `payrolls` — Payroll headers
- `payroll_items` — Individual payroll line items
- `branding_settings` — School name, address, logo (single row)
- `non_teaching_staff` — Non-teaching staff records
- `budgets` — Term budget items by category (term, academicYear, category, estimatedAmount, currency)

## Important Files

- `shared/schema.ts` — Drizzle schema and Zod validation
- `shared/models/auth.ts` — User/Session tables (mandatory for Replit Auth)
- `server/routes.ts` — API routes with isAdmin/canModify middleware
- `server/storage.ts` — Storage interface and DB implementation
- `server/replit_integrations/auth/storage.ts` — Auth storage with role management
- `client/src/components/layout.tsx` — Sidebar layout with RBAC-filtered menu items
- `client/src/pages/settings/index.tsx` — Settings with Branding + User Management tabs
- `client/src/pages/settings/users.tsx` — User management component
- `client/src/pages/staff/index.tsx` — Staff page with Teaching/Non-Teaching tabs
- `client/src/pages/verify-receipt/index.tsx` — Public receipt verification page
- `client/src/lib/pdf-receipts.ts` — PDF generators with dynamic branding support
- `client/src/components/receipt-print.tsx` — Printable receipt with branding
- `client/src/hooks/use-branding.ts` — Branding data hooks
- `client/src/hooks/use-non-teaching-staff.ts` — Non-teaching staff CRUD hooks
- `client/src/hooks/use-teachers.ts` — Teacher data hooks
- `client/src/hooks/use-payrolls.ts` — Payroll data hooks
- `client/src/hooks/use-expenses.ts` — Expense data hooks
- `client/src/hooks/use-budgets.ts` — Budget CRUD and comparison hooks
- `client/src/pages/reports/index.tsx` — Financial reports page (Weekly/Monthly/Termly)
- `client/src/pages/budget/index.tsx` — Budget tracking page
- `client/src/lib/pdf-reports.ts` — Financial report PDF generator
- `client/src/lib/utils.ts` — Utility functions including `formatCurrency()`

## Running

- Workflow "Start application" runs `npm run dev` (Express + Vite dev server on port 5000)

## Notes

- System name: **HelioPay** (renamed from EduPay)
- Currency formatting via `formatCurrency(amount, currency)` in `client/src/lib/utils.ts`
- Replit Auth handles login/logout — no local auth
- First user auto-assigned Admin role; subsequent users default to Bursar
- Net salary = baseSalary + accommodationAllowance + transportAllowance + otherAllowances - deductions
