import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";

import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import StudentsPage from "@/pages/students";
import StudentProfile from "@/pages/students/[id]";
import PaymentsPage from "@/pages/payments";
import ExpensesPage from "@/pages/expenses";
import StaffPage from "@/pages/staff";
import PayrollPage from "@/pages/payroll";
import ReportsPage from "@/pages/reports";
import SettingsPage from "@/pages/settings";
import BudgetPage from "@/pages/budget";
import VerifyReceiptPage from "@/pages/verify-receipt";
import { Layout } from "@/components/layout";
import { Loader2 } from "lucide-react";

function ProtectedRoutes() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard}/>
        <Route path="/students" component={StudentsPage}/>
        <Route path="/students/:id" component={StudentProfile}/>
        <Route path="/payments" component={PaymentsPage}/>
        <Route path="/expenses" component={ExpensesPage}/>
        <Route path="/staff" component={StaffPage}/>
        <Route path="/payroll" component={PayrollPage}/>
        <Route path="/reports" component={ReportsPage}/>
        <Route path="/budget" component={BudgetPage}/>
        <Route path="/verify-receipt" component={VerifyReceiptPage}/>
        <Route path="/settings" component={SettingsPage}/>
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/verify-receipt" component={VerifyReceiptPage} />
      {!isAuthenticated ? <AuthPage /> : <ProtectedRoutes />}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
