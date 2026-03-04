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
import { LayoutDashboard, Users, CreditCard, LogOut, GraduationCap, Receipt, UserCheck, Wallet, ShieldCheck, Settings } from "lucide-react";
import { Button } from "./ui/button";

type UserRole = "Admin" | "Bursar" | "Principal" | "Suspended";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["Admin", "Bursar", "Principal"] as UserRole[] },
  { title: "Students", url: "/students", icon: Users, roles: ["Admin", "Bursar", "Principal"] as UserRole[] },
  { title: "Payments", url: "/payments", icon: CreditCard, roles: ["Admin", "Bursar", "Principal"] as UserRole[] },
  { title: "Expenses", url: "/expenses", icon: Receipt, roles: ["Admin", "Bursar"] as UserRole[] },
  { title: "Staff", url: "/staff", icon: UserCheck, roles: ["Admin", "Bursar", "Principal"] as UserRole[] },
  { title: "Payroll", url: "/payroll", icon: Wallet, roles: ["Admin", "Bursar"] as UserRole[] },
  { title: "Verify Receipt", url: "/verify-receipt", icon: ShieldCheck, roles: ["Admin", "Bursar", "Principal"] as UserRole[] },
];

function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const userRole = ((user as any)?.role || "Bursar") as UserRole;
  const visibleItems = menuItems.filter((item) => item.roles.includes(userRole));

  return (
    <Sidebar>
      <div className="p-6 flex items-center gap-3">
        <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
          <GraduationCap className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-lg leading-tight">HelioPay</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">System</span>
        </div>
      </div>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const isActive = location === item.url || (item.url !== "/" && location.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="font-medium h-11">
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {userRole === "Admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/settings" || location.startsWith("/settings")} className="font-medium h-11">
                    <Link href="/settings" className="flex items-center gap-3" data-testid="link-settings">
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-4">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="h-9 w-9 bg-accent rounded-full flex items-center justify-center text-accent-foreground font-bold">
            {user?.firstName?.[0] || user?.email?.[0] || "U"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-semibold truncate">{user?.firstName || "User"}</span>
            <span className="text-xs text-muted-foreground capitalize">{userRole}</span>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={style}>
      <div className="flex h-screen w-full bg-background/50 overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="h-16 flex items-center px-4 border-b bg-card/50 backdrop-blur-sm z-10 shrink-0">
            <SidebarTrigger className="hover-elevate" />
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-6xl mx-auto w-full pb-20">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
