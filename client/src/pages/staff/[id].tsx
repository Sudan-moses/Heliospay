import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Phone, BookOpen, Briefcase, DollarSign, Clock, FileText, FileDown } from "lucide-react";
import { Link } from "wouter";
import { useBranding } from "@/hooks/use-branding";
import { generatePayslipPDF } from "@/lib/pdf-reports";
import type { Teacher, NonTeachingStaff } from "@shared/schema";

export default function StaffProfile() {
  const [, params] = useRoute("/staff/:type/:id");
  const staffType = params?.type as "teacher" | "non-teaching";
  const staffId = parseInt(params?.id || "0");
  const isTeacher = staffType === "teacher";

  const apiBase = isTeacher ? "/api/teachers" : "/api/non-teaching-staff";
  const { data: branding } = useBranding();

  const { data: staff, isLoading } = useQuery<Teacher | NonTeachingStaff>({
    queryKey: [apiBase, staffId],
    enabled: staffId > 0,
  });

  const { data: payrollHistory, isLoading: payrollLoading } = useQuery<any[]>({
    queryKey: ["/api/staff", staffType, staffId, "payroll-history"],
    enabled: staffId > 0,
  });

  if (isLoading) {
    return (
      <div className="h-[50vh] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-8 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="text-center py-20 text-xl font-display text-muted-foreground" data-testid="text-staff-not-found">
        Staff member not found
      </div>
    );
  }

  const netSalary = staff.baseSalary + staff.accommodationAllowance + staff.transportAllowance + staff.otherAllowances - staff.deductions;

  const handleDownloadPayslip = (month?: string) => {
    generatePayslipPDF({
      staffName: staff.fullName,
      staffType,
      position: !isTeacher ? (staff as NonTeachingStaff).position : undefined,
      subjects: isTeacher ? (staff as Teacher).subjects : undefined,
      month: month || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" }),
      baseSalary: staff.baseSalary,
      accommodationAllowance: staff.accommodationAllowance,
      transportAllowance: staff.transportAllowance,
      otherAllowances: staff.otherAllowances,
      deductions: staff.deductions,
      deductionNotes: staff.deductionNotes || undefined,
      currency: staff.currency,
      status: staff.status,
    }, branding);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild className="h-10 w-10 rounded-xl hover-elevate" data-testid="button-back-staff">
          <Link href="/staff"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-staff-profile-title">
          {isTeacher ? "Teacher" : "Staff"} Profile
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="shadow-lg border-0 overflow-hidden relative">
            <div className="h-24 bg-gradient-to-br from-teal-600 to-teal-500 absolute w-full top-0 left-0"></div>
            <CardContent className="pt-12 relative z-10">
              <div className="h-24 w-24 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center text-4xl font-display font-bold text-teal-600 mb-4" data-testid="avatar-staff">
                {staff.fullName.charAt(0)}
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground" data-testid="text-staff-name">{staff.fullName}</h2>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={staff.status === "Active" ? "default" : "secondary"} className={staff.status === "Active" ? "bg-emerald-500/10 text-emerald-700" : ""} data-testid="badge-staff-status">
                  {staff.status}
                </Badge>
                <Badge variant="outline" className="font-mono bg-background" data-testid="badge-staff-type">
                  {isTeacher ? "Teacher" : "Non-Teaching"}
                </Badge>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><Phone className="h-4 w-4" /></div>
                  <div className="flex flex-col">
                    <span className="text-muted-foreground text-xs">Phone</span>
                    <span className="font-semibold text-foreground" data-testid="text-staff-phone">{staff.phoneNumber}</span>
                  </div>
                </div>

                {isTeacher && (staff as Teacher).subjects && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><BookOpen className="h-4 w-4" /></div>
                    <div className="flex flex-col">
                      <span className="text-muted-foreground text-xs">Subjects</span>
                      <div className="flex flex-wrap gap-1 mt-1" data-testid="text-staff-subjects">
                        {(staff as Teacher).subjects.map((subject, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{subject}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {!isTeacher && (
                  <>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><Briefcase className="h-4 w-4" /></div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Position</span>
                        <span className="font-semibold text-foreground" data-testid="text-staff-position">{(staff as NonTeachingStaff).position}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><FileText className="h-4 w-4" /></div>
                      <div className="flex flex-col">
                        <span className="text-muted-foreground text-xs">Contract Type</span>
                        <span className="font-semibold text-foreground" data-testid="text-staff-contract">{(staff as NonTeachingStaff).contractType}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
            <CardContent className="p-6">
              <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-6 flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Salary Breakdown
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Base Salary</span>
                  <span className="font-semibold" data-testid="text-base-salary">{formatCurrency(staff.baseSalary, staff.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Accommodation</span>
                  <span className="font-semibold" data-testid="text-accommodation">{formatCurrency(staff.accommodationAllowance, staff.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Transport</span>
                  <span className="font-semibold" data-testid="text-transport">{formatCurrency(staff.transportAllowance, staff.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Other Allowances</span>
                  <span className="font-semibold" data-testid="text-other-allowances">{formatCurrency(staff.otherAllowances, staff.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-red-400 text-sm">Deductions</span>
                  <span className="font-semibold text-red-400" data-testid="text-deductions">-{formatCurrency(staff.deductions, staff.currency)}</span>
                </div>
                {staff.deductionNotes && (
                  <p className="text-slate-500 text-xs italic" data-testid="text-deduction-notes">{staff.deductionNotes}</p>
                )}
                <div className="border-t border-slate-700/50 pt-4 flex justify-between items-center">
                  <span className="text-white font-semibold">Net Salary</span>
                  <span className="text-2xl font-display font-bold" data-testid="text-net-salary">{formatCurrency(netSalary, staff.currency)}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-4 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  onClick={() => handleDownloadPayslip()}
                  data-testid="button-download-payslip"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Download Payslip
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between gap-2 bg-muted/20 border-b border-border/50 pb-4">
              <CardTitle className="text-xl font-display" data-testid="text-payroll-history-title">Payroll History</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {payrollLoading ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground">Loading payroll history...</div>
              ) : !payrollHistory || payrollHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium text-lg text-foreground" data-testid="text-no-payroll">No payroll records yet</p>
                  <p className="text-sm mt-1">Payroll entries will appear here once processed.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {payrollHistory.map((item: any) => (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors" data-testid={`row-payroll-${item.id}`}>
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                          <DollarSign className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground" data-testid={`text-payroll-amount-${item.id}`}>
                            {formatCurrency(item.amount, item.currency)}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
                            <span data-testid={`text-payroll-month-${item.id}`}>{item.payrollMonth}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={item.payrollStatus === "Approved" ? "default" : "secondary"}
                          className={item.payrollStatus === "Approved" ? "bg-emerald-500/10 text-emerald-700" : ""}
                          data-testid={`badge-payroll-status-${item.id}`}
                        >
                          {item.payrollStatus}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadPayslip(item.payrollMonth)}
                          data-testid={`button-payslip-${item.id}`}
                          title="Download Payslip"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
