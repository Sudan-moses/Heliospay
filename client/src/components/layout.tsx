import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, CreditCard, LogOut, GraduationCap, Receipt, UserCheck, Wallet, ShieldCheck, Settings, BarChart3, PiggyBank } from "lucide-react";
import { Button } from "./ui/button";

type UserRole = "Admin" | "Bursar" | "Principal" | "Suspended" | "Pending";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["Admin", "Bursar", "Principal"] as UserRole[] },
  { title: "Students", url: "/students", icon: Users, roles: ["Admin", "Bursar", "Principal"] as UserRole[] },
  { title: "Payments", url: "/payments", icon: CreditCard, roles: ["Admin", "Bursar", "Principal"] as UserRole[] },
  { title: "Expenses", url: "/expenses", icon: Receipt, roles: ["Admin", "Bursar"] as UserRole[] },
  { title: "Staff", url: "/staff", icon: UserCheck, roles: ["Admin", "Bursar", "Principal"] as UserRole[] },
  { title: "Payroll", url: "/payroll", icon: Wallet, roles: ["Admin", "Bursar"] as UserRole[] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["Admin", "Bursar"] as UserRole[] },
  { title: "Budget", url: "/budget", icon: PiggyBank, roles: ["Admin", "Bursar"] as UserRole[] },
];

function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const userRole = ((user as any)?.role || "Bursar") as UserRole;
  const visibleItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <Sidebar className="border-r border-border/40">
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg leading-tight text-foreground">HelioPay</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">System</span>
        </div>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-5 mb-1">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 space-y-0.5">
              {visibleItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className={`font-medium h-11 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary border-l-[3px] border-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                      <Link href={item.url} className="flex items-center gap-3 pl-4">
                        <item.icon className="h-[18px] w-[18px]" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-5 mb-1">General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-3 space-y-0.5">
              {userRole === "Admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/settings" || location.startsWith("/settings")} className={`font-medium h-11 rounded-xl transition-all duration-200 ${location === "/settings" || location.startsWith("/settings") ? 'bg-primary/10 text-primary border-l-[3px] border-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    <Link href="/settings" className="flex items-center gap-3 pl-4" data-testid="link-settings">
                      <Settings className="h-[18px] w-[18px]" />
                      <span className="text-sm">Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
            {user?.firstName?.[0] || user?.email?.[0] || "U"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate text-foreground">{user?.firstName || "User"}</span>
            <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl h-10" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

function PendingApprovalMessage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto h-20 w-20 bg-amber-500/10 rounded-full flex items-center justify-center">
          <ShieldCheck className="h-10 w-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-pending-title">Account Pending Approval</h1>
        <p className="text-muted-foreground" data-testid="text-pending-message">
          Your account has been created but is awaiting approval from an administrator.
          You will be able to access the system once your account has been approved and a role has been assigned.
        </p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userRole = ((user as any)?.role || "Pending") as UserRole;

  if (userRole === "Pending") {
    return <PendingApprovalMessage />;
  }

  const style = {
    "--sidebar-width": "16rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full bg-background overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="h-14 flex items-center px-6 border-b border-border/40 bg-card z-10 shrink-0">
            <SidebarTrigger className="hover:bg-muted rounded-xl" />
          </header>
          <main className="flex-1 overflow-auto p-6 md:p-8">
            <div className="max-w-6xl mx-auto w-full pb-20">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
