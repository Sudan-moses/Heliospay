import { useState } from "react";
import { usePayments } from "@/hooks/use-payments";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Printer, FileDown, CheckCircle2, XCircle, Loader2, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";
import { PaymentFormDialog } from "@/components/payment-form-dialog";
import { generatePaymentReceiptPDF } from "@/lib/pdf-receipts";
import { generateSSCSECollectionReportPDF } from "@/lib/pdf-reports";
import { ReceiptPrint } from "@/components/receipt-print";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VerifyResult {
  valid: boolean;
  payment?: {
    id: number;
    amount: number;
    currency: string;
    term: string;
    feeType: string;
    paymentDate: string;
    receiptNumber: string;
    notes: string | null;
  };
  student?: {
    fullName: string;
    admissionNumber: string;
    classGrade: string;
  };
}

function DetailRow({
  label,
  value,
  testId,
  children,
}: {
  label: string;
  value?: string;
  testId: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children ? (
        <span data-testid={testId}>{children}</span>
      ) : (
        <span className="text-sm font-medium" data-testid={testId}>
          {value}
        </span>
      )}
    </div>
  );
}

export default function PaymentsPage() {
  const { data: payments, isLoading } = usePayments();
  const { data: branding } = useBranding();
  const { user } = useAuth();
  const userRole = (user as any)?.role;
  const canEdit = userRole !== "Principal";
  const isAdmin = userRole === "Admin";
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const [printData, setPrintData] = useState<{payment: any, student: any} | null>(null);

  const [receiptNumber, setReceiptNumber] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [reportTerm, setReportTerm] = useState<string>("");
  const [reportClass, setReportClass] = useState<string>("");
  const [isGeneratingSSCSEReport, setIsGeneratingSSCSEReport] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDownloadSSCSEReport = async () => {
    setIsGeneratingSSCSEReport(true);
    try {
      const res = await fetch("/api/payments/sscse");
      if (!res.ok) throw new Error("Failed to fetch SSCSE data");
      const data = await res.json();
      generateSSCSECollectionReportPDF(data, branding);
    } catch (err) {
      console.error("Failed to generate SSCSE report:", err);
    } finally {
      setIsGeneratingSSCSEReport(false);
    }
  };

  const buildStudentFromPayment = (payment: any) => ({
    fullName: payment.studentName,
    admissionNumber: payment.studentAdmissionNumber || "N/A",
    classGrade: payment.studentClassGrade || "N/A",
    academicYear: payment.studentAcademicYear || new Date().getFullYear().toString(),
  });

  const handlePrint = (payment: any) => {
    setPrintData({ payment, student: buildStudentFromPayment(payment) });
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const filteredPayments = payments?.filter(p => 
    p.receiptNumber.toLowerCase().includes(search.toLowerCase()) || 
    p.studentName?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleVerify() {
    const trimmed = receiptNumber.trim();
    if (!trimmed) return;

    setIsVerifying(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/verify-receipt?receiptNumber=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error("Failed to verify");
      const data = await res.json();
      setVerifyResult(data);
    } catch {
      setVerifyResult({ valid: false });
    } finally {
      setIsVerifying(false);
    }
  }

  function handleVerifyKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleVerify();
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ReceiptPrint payment={printData?.payment} student={printData?.student} branding={branding} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Transaction Log</h1>
          <p className="text-muted-foreground mt-1 text-sm">View all recorded payments across the system</p>
        </div>
        {canEdit && (
          <Button onClick={() => setFormOpen(true)} className="rounded-xl font-semibold h-11 px-6 shadow-sm" data-testid="button-record-payment">
            <Plus className="mr-2 h-5 w-5" /> Record Payment
          </Button>
        )}
      </div>

      <Tabs defaultValue="all-payments" data-testid="tabs-payments">
        <TabsList className="rounded-xl bg-muted/60 p-1" data-testid="tabs-list-payments">
          <TabsTrigger value="all-payments" className="rounded-lg" data-testid="tab-all-payments">All Payments</TabsTrigger>
          <TabsTrigger value="verify-receipt" className="rounded-lg" data-testid="tab-verify-receipt">Verify Receipt</TabsTrigger>
        </TabsList>

        <TabsContent value="all-payments" data-testid="tab-content-all-payments">
          <div className="flex flex-wrap items-center gap-3 mb-4" data-testid="master-report-controls">
            <Select value={reportTerm} onValueChange={setReportTerm}>
              <SelectTrigger className="w-[140px] h-9 rounded-xl" data-testid="select-report-term">
                <SelectValue placeholder="All Terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reportClass} onValueChange={setReportClass}>
              <SelectTrigger className="w-[160px] h-9 rounded-xl" data-testid="select-report-class">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="Senior 1">Senior 1</SelectItem>
                <SelectItem value="Senior 2">Senior 2</SelectItem>
                <SelectItem value="Senior 3">Senior 3</SelectItem>
                <SelectItem value="Senior 4">Senior 4</SelectItem>
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSSCSEReport}
                disabled={isGeneratingSSCSEReport}
                className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                data-testid="button-download-sscse-report"
              >
                {isGeneratingSSCSEReport ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                SSCSE Collection Report
              </Button>
            )}
          </div>

          <Card className="shadow-sm rounded-2xl border-border/40 overflow-hidden">
            <div className="p-4 border-b border-border/30 bg-muted/20">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by student or receipt number..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-10 bg-background rounded-xl border-border/40 focus-visible:ring-primary/20"
                  data-testid="input-search-payments"
                />
              </div>
            </div>

            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Receipt</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Date</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Student</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Term</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Fee Type</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide text-right">Amount</TableHead>
                  <TableHead className="w-[100px] text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">Loading transactions...</TableCell>
                  </TableRow>
                ) : filteredPayments?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">No payments found.</TableCell>
                  </TableRow>
                ) : (
                  filteredPayments?.sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime()).flatMap((payment) => {
                    const paymentItems = (payment as any).items as { feeType: string; amount: number; currency: string }[] | undefined;
                    const hasMultiple = paymentItems && paymentItems.length > 1;
                    const isExpanded = expandedIds.has(payment.id);

                    const feeLabel = hasMultiple
                      ? `${paymentItems!.length} fees`
                      : paymentItems?.[0]?.feeType || (payment as any).feeType || "—";

                    return [
                      <TableRow key={payment.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-payment-${payment.id}`}>
                        <TableCell>
                          <span className="font-mono text-xs font-semibold px-2.5 py-1 bg-muted/60 rounded-lg border border-border/30">{payment.receiptNumber}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM dd, yyyy HH:mm') : ''}
                        </TableCell>
                        <TableCell className="font-semibold text-foreground text-sm">{payment.studentName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{(payment as any).term || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="rounded-lg font-normal text-xs">{feeLabel}</Badge>
                            {hasMultiple && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 rounded-md text-muted-foreground"
                                onClick={() => toggleExpand(payment.id)}
                                data-testid={`button-expand-${payment.id}`}
                                title={isExpanded ? "Hide breakdown" : "Show breakdown"}
                              >
                                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl text-sm">
                            +{formatCurrency(payment.amount, payment.currency)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="hover:text-primary rounded-xl h-8 w-8" onClick={() => handlePrint(payment)} title="Print Receipt">
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" title="Download PDF" data-testid={`button-pdf-payment-${payment.id}`} onClick={() => {
                            generatePaymentReceiptPDF(payment, buildStudentFromPayment(payment), branding).catch(() => {});
                          }}>
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>,
                      ...(hasMultiple && isExpanded ? [
                        <TableRow key={`${payment.id}-breakdown`} className="bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={7} className="py-2 px-8">
                            <div className="rounded-xl overflow-hidden border border-border/40 bg-background">
                              <Table>
                                <TableHeader className="bg-primary/5">
                                  <TableRow className="hover:bg-transparent border-b border-border/30">
                                    <TableHead className="py-2 text-xs font-semibold uppercase tracking-wide text-primary">Fee Type</TableHead>
                                    <TableHead className="py-2 text-xs font-semibold uppercase tracking-wide text-primary text-right">Amount</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {paymentItems!.map((item, idx) => (
                                    <TableRow key={idx} className="hover:bg-transparent border-b border-border/20 last:border-0">
                                      <TableCell className="py-2 text-sm text-muted-foreground">{item.feeType}</TableCell>
                                      <TableCell className="py-2 text-right text-sm font-semibold text-emerald-600">
                                        +{formatCurrency(item.amount, item.currency || payment.currency)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  <TableRow className="hover:bg-transparent bg-emerald-50/50">
                                    <TableCell className="py-2 text-sm font-bold text-foreground">Total Paid</TableCell>
                                    <TableCell className="py-2 text-right text-sm font-bold text-emerald-700">
                                      +{formatCurrency(payment.amount, payment.currency)}
                                    </TableCell>
                                  </TableRow>
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      ] : []),
                    ];
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="verify-receipt" data-testid="tab-content-verify-receipt">
          <div className="flex items-center justify-center min-h-[50vh]">
            <Card className="w-full max-w-lg rounded-2xl shadow-sm border-border/40">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-3 h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold" data-testid="text-verify-heading">
                  Verify Payment Receipt
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter a receipt number to verify its authenticity
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-2">
                  <Input
                    data-testid="input-receipt-number"
                    placeholder="Enter receipt number (e.g., RCP-00001)"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    onKeyDown={handleVerifyKeyDown}
                    className="rounded-xl"
                  />
                  <Button
                    data-testid="button-verify"
                    onClick={handleVerify}
                    disabled={isVerifying || !receiptNumber.trim()}
                    className="rounded-xl"
                  >
                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    <span className="ml-2">Verify</span>
                  </Button>
                </div>

                {isVerifying && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                )}

                {!isVerifying && hasSearched && verifyResult && (
                  <div data-testid="verify-result">
                    {verifyResult.valid && verifyResult.payment && verifyResult.student ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-emerald-700" data-testid="text-valid-status">
                              Valid Receipt
                            </p>
                            <p className="text-sm text-emerald-600">
                              This receipt is authentic and verified.
                            </p>
                          </div>
                          <Badge className="ml-auto bg-emerald-100 text-emerald-700 rounded-lg no-default-hover-elevate no-default-active-elevate">Valid</Badge>
                        </div>

                        <div className="space-y-1">
                          <DetailRow label="Student Name" value={verifyResult.student.fullName} testId="text-student-name" />
                          <DetailRow label="Admission No." value={verifyResult.student.admissionNumber} testId="text-admission-number" />
                          <DetailRow label="Class" value={verifyResult.student.classGrade} testId="text-class-grade" />
                          <DetailRow
                            label="Amount"
                            value={formatCurrency(verifyResult.payment.amount, verifyResult.payment.currency)}
                            testId="text-amount"
                          />
                          <DetailRow label="Fee Type" testId="text-fee-type">
                            <Badge variant="secondary" className="rounded-lg">{verifyResult.payment.feeType}</Badge>
                          </DetailRow>
                          <DetailRow label="Term" value={verifyResult.payment.term} testId="text-term" />
                          <DetailRow
                            label="Date"
                            value={new Date(verifyResult.payment.paymentDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                            testId="text-date"
                          />
                          <DetailRow label="Receipt No." value={verifyResult.payment.receiptNumber} testId="text-receipt-number" />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                        <XCircle className="h-6 w-6 text-red-500 shrink-0" />
                        <div>
                          <p className="font-semibold text-red-700" data-testid="text-invalid-status">
                            Invalid Receipt
                          </p>
                          <p className="text-sm text-red-600">
                            No payment found with this receipt number.
                          </p>
                        </div>
                        <Badge className="ml-auto bg-red-100 text-red-700 rounded-lg no-default-hover-elevate no-default-active-elevate" variant="destructive">Invalid</Badge>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <PaymentFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
