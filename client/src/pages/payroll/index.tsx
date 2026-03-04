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
import { Plus, Trash2, CheckCircle, XCircle, ChevronDown, ChevronUp, FileDown } from "lucide-react";
import { generatePayrollReceiptPDF } from "@/lib/pdf-receipts";
import type { BrandingParam } from "@/lib/pdf-receipts";
import { useBranding } from "@/hooks/use-branding";
import { Skeleton } from "@/components/ui/skeleton";
import type { Payroll } from "@shared/schema";

const statusBadgeVariants: Record<string, string> = {
  Draft: "bg-gray-500/10 text-gray-700 border-gray-200 dark:text-gray-300 dark:border-gray-600",
  Pending: "bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-300 dark:border-yellow-600",
  Approved: "bg-green-500/10 text-green-700 border-green-200 dark:text-green-300 dark:border-green-600",
  Rejected: "bg-red-500/10 text-red-700 border-red-200 dark:text-red-300 dark:border-red-600",
};

function PayrollCard({ payroll, isAdmin, branding }: { payroll: Payroll; isAdmin: boolean; branding?: BrandingParam }) {
  const [expanded, setExpanded] = useState(false);
  const { data: detail, isLoading: detailLoading } = usePayroll(expanded ? payroll.id : 0);
  const approveMutation = useApprovePayroll();
  const rejectMutation = useRejectPayroll();
  const deleteMutation = useDeletePayroll();

  return (
    <Card className="shadow-sm border-border/50 overflow-visible" data-testid={`card-payroll-${payroll.id}`}>
      <div
        className="p-4 cursor-pointer flex flex-row flex-wrap items-center justify-between gap-3"
        onClick={() => setExpanded(!expanded)}
        data-testid={`button-expand-payroll-${payroll.id}`}
      >
        <div className="flex flex-row flex-wrap items-center gap-3">
          <span className="font-display font-bold text-lg text-foreground" data-testid={`text-payroll-month-${payroll.id}`}>
            {payroll.month}
          </span>
          <Badge variant="outline" className={statusBadgeVariants[payroll.status] || statusBadgeVariants.Draft} data-testid={`badge-payroll-status-${payroll.id}`}>
            {payroll.status}
          </Badge>
        </div>
        <div className="flex flex-row flex-wrap items-center gap-4">
          <span className="font-bold text-foreground" data-testid={`text-payroll-total-${payroll.id}`}>
            {formatCurrency(payroll.totalAmount, payroll.currency)}
          </span>
          <span className="text-sm text-muted-foreground" data-testid={`text-payroll-createdby-${payroll.id}`}>
            {payroll.createdBy}
          </span>
          <span className="text-sm text-muted-foreground">
            {payroll.createdAt ? format(new Date(payroll.createdAt), "MMM dd, yyyy") : ""}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border/50 p-4 space-y-4">
          {detailLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ) : detail?.items && detail.items.length > 0 ? (
            <div className="space-y-2" data-testid={`list-payroll-items-${payroll.id}`}>
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Teacher Salaries</p>
              {detail.items.map((item) => (
                <div key={item.id} className="flex flex-row flex-wrap items-center justify-between gap-2 py-1 px-2 rounded-md bg-muted/30" data-testid={`row-payroll-item-${item.id}`}>
                  <span className="text-sm font-medium text-foreground" data-testid={`text-teacher-name-${item.id}`}>{item.teacherName}</span>
                  <span className="text-sm font-bold text-foreground" data-testid={`text-teacher-amount-${item.id}`}>{formatCurrency(item.amount, item.currency)}</span>
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
                  data-testid={`button-approve-payroll-${payroll.id}`}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => rejectMutation.mutate(payroll.id)}
                  disabled={rejectMutation.isPending}
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
                className="hover:text-red-600"
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
                className="hover:text-blue-600"
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
          <p className="text-muted-foreground mt-1">Generate and manage teacher payrolls</p>
        </div>
        {canEdit && (
          <Button onClick={() => setDialogOpen(true)} data-testid="button-generate-payroll">
            <Plus className="mr-2 h-5 w-5" /> Generate Payroll
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : payrolls?.length === 0 ? (
        <Card className="shadow-sm border-border/50 p-8 text-center">
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
        <DialogContent data-testid="dialog-generate-payroll">
          <DialogHeader>
            <DialogTitle>Generate Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payroll-month">Month</Label>
              <Input
                id="payroll-month"
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                data-testid="input-payroll-month"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payroll-currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger data-testid="select-payroll-currency">
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
