import { Button } from "@/components/ui/button";
import { GraduationCap, ShieldCheck, Zap, Lock } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel: Hero/Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 bg-sidebar text-sidebar-foreground relative overflow-hidden">
        {/* landing page hero abstract dark premium architecture */}
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
            alt="Architecture background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-sidebar via-sidebar to-transparent"></div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">EduPay</span>
        </div>

        <div className="relative z-10 max-w-lg mt-20">
          <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight mb-6">
            The Modern Standard for School Finance.
          </h1>
          <p className="text-sidebar-foreground/70 text-lg leading-relaxed mb-12">
            Record payments, track student balances, and generate printable receipts instantly. Designed specifically for primary and secondary schools.
          </p>

          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Secure Records</h3>
                <p className="text-sm text-sidebar-foreground/60">Enterprise-grade security for all financial data.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Lightning Fast</h3>
                <p className="text-sm text-sidebar-foreground/60">Optimized workflows for bursars and accountants.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-sidebar-foreground/40 font-medium">
          © {new Date().getFullYear()} EduPay Systems. All rights reserved.
        </div>
      </div>

      {/* Right Panel: Auth Action */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative">
        <div className="max-w-md w-full glass-panel rounded-3xl p-8 sm:p-12 relative z-10 text-center flex flex-col items-center">
          
          <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
            <Lock className="h-8 w-8" />
          </div>
          
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">Welcome Back</h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Sign in to access your administrative dashboard and financial records.
          </p>

          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-semibold hover-elevate shadow-lg shadow-primary/25 rounded-xl bg-gradient-to-r from-primary to-primary/90"
            onClick={() => window.location.href = "/api/login"}
          >
            Log In to Continue
          </Button>

          <p className="mt-8 text-sm text-muted-foreground">
            Protected by Replit Auth. Ensure your account has the proper permissions (Admin or Bursar) assigned.
          </p>
        </div>
      </div>
    </div>
  );
}
