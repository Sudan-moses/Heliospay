# HelioPay System

A web-based School Payment Recording System for private primary and secondary schools in Africa, optimized for desktop use by school accountants.

## Architecture

- **Frontend**: React + Vite, Shadcn UI, TanStack Query, Wouter routing
- **Backend**: Express.js, Drizzle ORM, PostgreSQL
- **Auth**: Replit Auth (sessions/users tables) with RBAC (Admin/Bursar/Principal/Suspended/Pending roles)
- **Styling**: Tailwind CSS with dark mode support

## Key Features

- **RBAC**: Admin (full access), Bursar (Students, Payments, Expenses, Staff, Payroll, Reports, Budget), Principal (view-only: Dashboard, Students, Payments, Staff), Pending (blocked until admin approves), Suspended (blocked)
- **Pending User Approval**: New users get "Pending" role by default; must be approved by Admin before accessing the system
- Student CRUD management with class levels: Senior 1–4
- Payment recording with multi-fee line items per payment, grouped student dropdown by class
- Auto-generated receipt numbers, printable receipts, PDF generation (jspdf, client-side)
- Receipt verification: embedded as tab in Payments page + standalone public route at /verify-receipt
- Master Payment Report: downloadable PDF filtered by term and class
- Expense recording by category with term association
- Staff management with two tabs: Teaching Staff and Non-Teaching Staff
- Staff profile pages at /staff/:type/:id with salary breakdown and payroll history
- Teacher & Non-Teaching Staff salary breakdown: base + accommodation + transport + other allowances - deductions
- Payslip PDF generation from staff profile or payroll items
- Payroll generation from active teachers AND non-teaching staff, approval workflow (Draft → Approved/Rejected)
- **Financial Management Suite**:
  - Reports page: Weekly/Monthly/Termly financial summaries with PDF export
  - Budget tracking: Set term budgets by category, view budget vs actual comparison with variance
  - Term Financial Health: Revenue - Expenses = Net Profit displayed on Dashboard (Admin/Principal)
- Settings page: School Branding (name, address, logo) — appears in all PDF headers
- User management (admin only): view all users, change roles, prominent pending approval UI
- Dashboard with charts, financial metrics, and Term Financial Health snapshot
- Multi-currency support: UGX and USD

## Database Tables

- `users` — Replit Auth users with role column (Admin/Bursar/Principal/Suspended/Pending)
- `sessions` — Replit Auth sessions
- `students` — Student records
- `payments` — Payment records with receipt numbers and feeBreakdown JSON
- `expenses` — Expense records
- `teachers` — Teaching staff with salary breakdown
- `non_teaching_staff` — Non-teaching staff with full salary breakdown (accommodation, transport, other allowances, deductions)
- `payrolls` — Payroll headers
- `payroll_items` — Individual payroll line items (supports both teacherId and nonTeachingStaffId, staffType field)
- `branding_settings` — School name, address, logo (single row)
- `budgets` — Term budget items by category (term, academicYear, category, estimatedAmount, currency)

## Important Files

- `shared/schema.ts` — Drizzle schema and Zod validation
- `shared/models/auth.ts` — User/Session tables (mandatory for Replit Auth)
- `server/routes.ts` — API routes with isAdmin/canModify/blockInactive middleware
- `server/storage.ts` — Storage interface and DB implementation
- `server/replit_integrations/auth/storage.ts` — Auth storage with role management
- `client/src/components/layout.tsx` — Sidebar layout with RBAC-filtered menu items + Pending approval screen
- `client/src/pages/settings/index.tsx` — Settings with Branding + User Management tabs
- `client/src/pages/settings/users.tsx` — User management with pending user approval cards
- `client/src/pages/staff/index.tsx` — Staff page with Teaching/Non-Teaching tabs + View profile links
- `client/src/pages/staff/[id].tsx` — Staff profile page with salary breakdown and payroll history
- `client/src/pages/payments/index.tsx` — Payments page with All Payments tab, Verify Receipt tab, and Master Report download
- `client/src/pages/verify-receipt/index.tsx` — Public receipt verification page (standalone)
- `client/src/lib/pdf-receipts.ts` — PDF generators for receipts and payroll
- `client/src/lib/pdf-reports.ts` — Financial report PDF, Master Payment PDF, and Payslip PDF generators
- `client/src/components/receipt-print.tsx` — Printable receipt with branding
- `client/src/components/non-teaching-staff-form-dialog.tsx` — Non-teaching staff form with allowance fields
- `client/src/components/payment-form-dialog.tsx` — Payment form with multi-fee line items
- `client/src/hooks/use-branding.ts` — Branding data hooks
- `client/src/hooks/use-non-teaching-staff.ts` — Non-teaching staff CRUD hooks
- `client/src/hooks/use-teachers.ts` — Teacher data hooks
- `client/src/hooks/use-payrolls.ts` — Payroll data hooks
- `client/src/hooks/use-expenses.ts` — Expense data hooks
- `client/src/hooks/use-budgets.ts` — Budget CRUD and comparison hooks
- `client/src/pages/reports/index.tsx` — Financial reports page (Weekly/Monthly/Termly)
- `client/src/pages/budget/index.tsx` — Budget tracking page
- `client/src/lib/utils.ts` — Utility functions including `formatCurrency()`

## Running

- Workflow "Start application" runs `npm run dev` (Express + Vite dev server on port 5000)

## Notes

- System name: **HelioPay** (renamed from EduPay)
- Currency formatting via `formatCurrency(amount, currency)` in `client/src/lib/utils.ts`
- Replit Auth handles login/logout — no local auth
- First user auto-assigned Admin role; subsequent users default to Pending (awaiting approval)
- Net salary = baseSalary + accommodationAllowance + transportAllowance + otherAllowances - deductions
- Fee types: Tuition Fee, Admission Fee, Uniform Fee, Boarding Fee, Transport Fee, Lab Fee, SSCSE Fee (Senior 4 only)
- Payments support multiple fee line items stored in feeBreakdown JSON field
