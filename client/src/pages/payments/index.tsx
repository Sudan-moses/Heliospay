import { useState } from "react";
import { usePayments } from "@/hooks/use-payments";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Printer, FileDown } from "lucide-react";
import { PaymentFormDialog } from "@/components/payment-form-dialog";
import { generatePaymentReceiptPDF } from "@/lib/pdf-receipts";
import { ReceiptPrint } from "@/components/receipt-print";
import { Input } from "@/components/ui/input";

export default function PaymentsPage() {
  const { data: payments, isLoading } = usePayments();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const [printData, setPrintData] = useState<{payment: any, student: any} | null>(null);

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ReceiptPrint payment={printData?.payment} student={printData?.student} />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Transaction Log</h1>
          <p className="text-muted-foreground mt-1">View all recorded payments across the system</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="hover-elevate shadow-lg shadow-primary/20 font-semibold h-11 px-6 bg-gradient-to-r from-primary to-primary/90">
          <Plus className="mr-2 h-5 w-5" /> Record Payment
        </Button>
      </div>

      <Card className="shadow-md border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search by student or receipt number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background border-border/50 focus-visible:ring-primary/20"
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">Receipt Number</TableHead>
              <TableHead className="font-semibold text-foreground">Date</TableHead>
              <TableHead className="font-semibold text-foreground">Student</TableHead>
              <TableHead className="font-semibold text-foreground">Term</TableHead>
              <TableHead className="font-semibold text-foreground">Fee Type</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Amount</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
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
              filteredPayments?.sort((a, b) => new Date(b.paymentDate!).getTime() - new Date(a.paymentDate!).getTime()).map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-payment-${payment.id}`}>
                  <TableCell>
                    <span className="font-mono text-sm font-bold px-2 py-1 bg-muted rounded-md border border-border/50">{payment.receiptNumber}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM dd, yyyy HH:mm') : ''}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">{payment.studentName}</TableCell>
                  <TableCell className="text-muted-foreground">{(payment as any).term || "—"}</TableCell>
                  <TableCell>
                    <span className="text-sm px-2 py-0.5 bg-muted rounded-md border border-border/50">{(payment as any).feeType || "—"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200">
                      +{formatCurrency(payment.amount, payment.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="hover-elevate hover:text-primary" onClick={() => handlePrint(payment)} title="Print Receipt">
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Download PDF" data-testid={`button-pdf-payment-${payment.id}`} onClick={() => {
                      generatePaymentReceiptPDF(payment, buildStudentFromPayment(payment));
                    }}>
                      <FileDown className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <PaymentFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
