import { useState } from "react";
import { usePayrolls, usePayroll, useCreatePayroll, useApprovePayroll, useRejectPayroll, useDeletePayroll } from "@/hooks/use-payrolls";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, FileDown, User } from "lucide-react";
import { Link } from "wouter";
import { generatePayrollReceiptPDF } from "@/lib/pdf-receipts";
import type { BrandingParam } from "@/lib/pdf-receipts";
import { useBranding } from "@/hooks/use-branding";
import { Skeleton } from "@/components/ui/skeleton";
import type { Payroll } from "@shared/schema";

const statusBadgeVariants: Record<string, string> = {
  Draft: "bg-gray-50 text-gray-700 border border-gray-200",
  Pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  Approved: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  Rejected: "bg-red-50 text-red-700 border border-red-200",
};

function PayrollCard({ payroll, isAdmin, branding }: { payroll: Payroll; isAdmin: boolean; branding?: BrandingParam }) {
  const [expanded, setExpanded] = useState(false);
  const { data: detail, isLoading: detailLoading } = usePayroll(expanded ? payroll.id : 0);
  const approveMutation = useApprovePayroll();
  const rejectMutation = useRejectPayroll();
  const deleteMutation = useDeletePayroll();

  return (
    <Card className="shadow-sm rounded-2xl border-border/40 overflow-visible" data-testid={`card-payroll-${payroll.id}`}>
      <div
        className="p-5 cursor-pointer flex flex-row flex-wrap items-center justify-between gap-3 hover:bg-muted/10 transition-colors rounded-2xl"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-payroll-${payroll.id}`}
      >
        <div className="flex flex-row flex-wrap items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
            {payroll.month?.substring(0, 3) || "P"}
          </div>
          <div>
            <span className="font-display font-bold text-foreground block" data-testid={`text-payroll-month-${payroll.id}`}>
              {payroll.month}
            </span>
            <span className="text-xs text-muted-foreground" data-testid={`text-payroll-createdby-${payroll.id}`}>
              by {payroll.createdBy} · {payroll.createdAt ? format(new Date(payroll.createdAt), "MMM dd, yyyy") : ""}
            </span>
          </div>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-3">
          <span className="font-bold text-foreground" data-testid={`text-payroll-total-${payroll.id}`}>
            {formatCurrency(payroll.totalAmount, payroll.currency)}
          </span>
          <Badge className={`rounded-full text-xs font-medium px-3 ${statusBadgeVariants[payroll.status] || statusBadgeVariants.Draft}`} data-testid={`badge-payroll-status-${payroll.id}`}>
            {payroll.status}
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/30 p-5 space-y-4">
          {detailLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 rounded-lg" />
            </div>
          ) : detail?.items && detail.items.length > 0 ? (
            <div className="space-y-2" data-testid={`list-payroll-items-${payroll.id}`}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Staff Salaries</p>
              {detail.items.map((item: any) => (
                <div key={item.id} className="flex flex-row flex-wrap items-center justify-between gap-2 py-2.5 px-3 rounded-xl bg-muted/20" data-testid={`row-payroll-item-${item.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {(item.staffName || item.teacherName || "S").charAt(0)}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground" data-testid={`text-staff-name-${item.id}`}>{item.staffName || item.teacherName}</span>
                      {item.staffType && (
                        <Badge variant="secondary" className="ml-2 text-[10px] rounded-lg h-5 px-2">
                          {item.staffType === "teacher" ? "Teaching" : "Non-Teaching"}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground" data-testid={`text-staff-amount-${item.id}`}>{formatCurrency(item.amount, item.currency)}</span>
                    {(item.teacherId || item.nonTeachingStaffId) && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" asChild data-testid={`button-view-staff-${item.id}`} title="View Profile">
                        <Link href={`/staff/${item.staffType === "non-teaching" ? "non-teaching" : "teacher"}/${item.nonTeachingStaffId || item.teacherId}`}>
                          <User className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payroll items found.</p>
          )}

          {payroll.status === "Approved" && (
            <p className="text-sm text-muted-foreground" data-testid={`text-payroll-approved-info-${payroll.id}`}>
              Approved by {payroll.approvedBy || "Admin"}{payroll.approvedAt ? ` on ${format(new Date(payroll.approvedAt), "MMM dd, yyyy")}` : ""}
            </p>
          )}

          {payroll.status === "Rejected" && (
            <p className="text-sm text-muted-foreground" data-testid={`text-payroll-rejected-info-${payroll.id}`}>
              Rejected by {payroll.approvedBy || "Admin"}{payroll.approvedAt ? ` on ${format(new Date(payroll.approvedAt), "MMM dd, yyyy")}` : ""}
            </p>
          )}

          <div className="flex flex-row flex-wrap items-center gap-2">
            {payroll.status === "Draft" && isAdmin && (
              <>
                <Button
                  onClick={() => approveMutation.mutate(payroll.id)}
                  disabled={approveMutation.isPending}
                  className="rounded-xl"
                  data-testid={`button-approve-payroll-${payroll.id}`}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => rejectMutation.mutate(payroll.id)}
                  disabled={rejectMutation.isPending}
                  className="rounded-xl"
                  data-testid={`button-reject-payroll-${payroll.id}`}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                </Button>
              </>
            )}
            {payroll.status === "Draft" && (
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-red-600 rounded-xl h-8 w-8"
                onClick={() => deleteMutation.mutate(payroll.id)}
                disabled={deleteMutation.isPending}
                data-testid={`button-delete-payroll-${payroll.id}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {detail?.items && (
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => generatePayrollReceiptPDF(payroll, detail?.items || [], branding)}
                data-testid={`button-pdf-payroll-${payroll.id}`}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

export default function PayrollPage() {
  const { data: payrolls, isLoading } = usePayrolls();
  const { data: branding } = useBranding();
  const createMutation = useCreatePayroll();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [month, setMonth] = useState("");
  const [currency, setCurrency] = useState("UGX");

  const userRole = (user as any)?.role || "Bursar";
  const isAdmin = userRole === "Admin";
  const canEdit = userRole !== "Principal";

  const handleGenerate = () => {
    if (!month) return;
    createMutation.mutate(
      {
        month,
        status: "Draft",
        createdBy: (user as any)?.email || (user as any)?.username || "admin",
        currency,
      },
      {
        onSuccess: () => {
          setDialogOpen(false);
          setMonth("");
          setCurrency("UGX");
        },
      }
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-payroll-title">Payroll</h1>
          <p className="text-muted-foreground mt-1 text-sm">Generate and manage staff payrolls</p>
        </div>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)} className="rounded-xl font-semibold shadow-sm" data-testid="button-generate-payroll">
            <Plus className="mr-2 h-5 w-5" /> Generate Payroll
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : payrolls?.length === 0 ? (
        <Card className="shadow-sm rounded-2xl border-border/40 p-8 text-center">
          <p className="text-muted-foreground" data-testid="text-no-payrolls">No payrolls found. Generate one to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3" data-testid="list-payrolls">
          {payrolls?.map((payroll) => (
            <PayrollCard key={payroll.id} payroll={payroll} isAdmin={isAdmin} branding={branding} />
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl" data-testid="dialog-generate-payroll">
          <DialogHeader>
            <DialogTitle className="font-display">Generate Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payroll-month">Month</Label>
              <Input
                id="payroll-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-xl"
                data-testid="input-payroll-month"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payroll-currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="rounded-xl" data-testid="select-payroll-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UGX">UGX</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleGenerate}
              disabled={!month || createMutation.isPending}
              className="rounded-xl"
              data-testid="button-submit-generate-payroll"
            >
              {createMutation.isPending ? "Generating..." : "Generate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
