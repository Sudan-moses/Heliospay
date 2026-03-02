# HelioPay System

A web-based School Payment Recording System for private primary and secondary schools in Africa, optimized for desktop use by school accountants.

## Architecture

- **Frontend**: React + Vite, Shadcn UI, TanStack Query, Wouter routing
- **Backend**: Express.js, Drizzle ORM, PostgreSQL
- **Auth**: Replit Auth (sessions/users tables)
- **Styling**: Tailwind CSS with dark mode support

## Key Features

- Two roles: Admin (full access) and Bursar (record payments / view only)
- Student CRUD management with class levels: Senior 1, Senior 2, Senior 3, Senior 4
- Payment recording by term (Term 1, 2, 3) and fee type (Tuition, Admission, Uniform, Boarding)
- SSCSE Fee option available exclusively for Senior 4 students (enforced on backend)
- Auto-generated receipt numbers and printable receipts (include term and fee type)
- Expense recording by category (Rent, Maintenance, Security, Salaries, Utilities, Supplies, Transport, Other)
- Dashboard with charts and financial metrics
- Multi-currency support: UGX (Ugandan Shillings) and USD

## Important Files

- `shared/schema.ts` — Drizzle schema and Zod validation
- `server/routes.ts` — API routes
- `server/storage.ts` — Storage interface and DB implementation
- `client/src/pages/dashboard.tsx` — Dashboard with metrics and charts
- `client/src/components/layout.tsx` — Sidebar layout
- `client/src/components/receipt-print.tsx` — Printable receipt component
- `client/src/components/payment-form-dialog.tsx` — Payment form
- `client/src/components/student-form-dialog.tsx` — Student form
- `client/src/pages/auth-page.tsx` — Login page
- `client/src/pages/expenses/index.tsx` — Expenses list page
- `client/src/components/expense-form-dialog.tsx` — Expense recording form
- `client/src/hooks/use-expenses.ts` — Expense data hooks
- `client/src/lib/utils.ts` — Utility functions including `formatCurrency()`

## Running

- Workflow "Start application" runs `npm run dev` (Express + Vite dev server on port 5000)

## Notes

- System name: **HelioPay** (renamed from EduPay)
- Currency formatting via `formatCurrency(amount, currency)` in `client/src/lib/utils.ts`
- Replit Auth handles login/logout — do not use local auth
