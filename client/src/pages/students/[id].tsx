import { useRoute } from "wouter";
import { useStudent } from "@/hooks/use-students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowLeft, CreditCard, Phone, Calendar, BookOpen, Clock } from "lucide-react";
import { Link } from "wouter";
import { PaymentFormDialog } from "@/components/payment-form-dialog";
import { useState } from "react";
import { ReceiptPrint } from "@/components/receipt-print";

export default function StudentProfile() {
  const [, params] = useRoute("/students/:id");
  const studentId = parseInt(params?.id || "0");
  const { data: student, isLoading } = useStudent(studentId);
  const [paymentOpen, setPaymentOpen] = useState(false);
  
  // Print state tracking
  const [printData, setPrintData] = useState<{payment: any, student: any} | null>(null);

  const handlePrint = (payment: any) => {
    setPrintData({ payment, student });
    setTimeout(() => {
      window.print();
    }, 100);
  };

  if (isLoading) return <div className="h-[50vh] flex items-center justify-center"><div className="animate-pulse flex flex-col items-center"><div className="h-8 w-8 bg-primary rounded-full animate-bounce" /></div></div>;
  if (!student) return <div className="text-center py-20 text-xl font-display text-muted-foreground">Student not found</div>;

  const pctPaid = student.tuitionFee > 0 ? Math.min(100, Math.round((student.totalPaid / student.tuitionFee) * 100)) : 100;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ReceiptPrint payment={printData?.payment} student={printData?.student} />

      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild className="h-10 w-10 rounded-xl hover-elevate">
          <Link href="/students"><ArrowLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-2xl font-display font-bold text-foreground">Student Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="space-y-6">
          <Card className="shadow-lg border-0 overflow-hidden relative">
            <div className="h-24 bg-gradient-to-br from-primary to-indigo-600 absolute w-full top-0 left-0"></div>
            <CardContent className="pt-12 relative z-10">
              <div className="h-24 w-24 rounded-2xl bg-background border-4 border-background shadow-xl flex items-center justify-center text-4xl font-display font-bold text-primary mb-4">
                {student.fullName.charAt(0)}
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">{student.fullName}</h2>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Badge variant="outline" className="font-mono bg-background">{student.admissionNumber}</Badge>
                <Badge variant={student.status === 'Active' ? 'default' : 'secondary'} className={student.status === 'Active' ? 'bg-emerald-500/10 text-emerald-700' : ''}>
                  {student.status}
                </Badge>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><BookOpen className="h-4 w-4" /></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs">Class / Grade</span><span className="font-semibold text-foreground">{student.classGrade}</span></div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><Phone className="h-4 w-4" /></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs">Parent Contact</span><span className="font-semibold text-foreground">{student.parentPhoneNumber}</span></div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0"><Calendar className="h-4 w-4" /></div>
                  <div className="flex flex-col"><span className="text-muted-foreground text-xs">Academic Year</span><span className="font-semibold text-foreground">{student.academicYear}</span></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
            <CardContent className="p-6">
              <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-6 flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Financial Summary
              </h3>
              
              <div className="space-y-6">
                <div>
                  <p className="text-slate-400 text-xs font-medium mb-1">Expected Tuition</p>
                  <p className="text-3xl font-display font-bold">{formatCurrency(student.tuitionFee, student.currency)}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                  <div>
                    <p className="text-emerald-400 text-xs font-medium mb-1">Total Paid</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(student.totalPaid, student.currency)}</p>
                  </div>
                  <div>
                    <p className="text-red-400 text-xs font-medium mb-1">Remaining</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(student.remainingBalance, student.currency)}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-slate-400">Progress</span>
                    <span className="font-bold">{pctPaid}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 w-full rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${pctPaid}%` }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Payments */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border/50 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b border-border/50 pb-4">
              <CardTitle className="text-xl font-display">Payment History</CardTitle>
              <Button onClick={() => setPaymentOpen(true)} className="hover-elevate shadow-md font-semibold bg-gradient-to-r from-primary to-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Record Payment
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {student.payments?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="font-medium text-lg text-foreground">No payments yet</p>
                  <p className="text-sm mt-1">Record the first payment for this student.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {student.payments?.sort((a: any, b: any) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map((payment: any) => (
                    <div key={payment.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                          <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-lg text-foreground">{formatCurrency(payment.amount, payment.currency)}</p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span className="font-mono bg-muted px-2 py-0.5 rounded">{payment.receiptNumber}</span>
                            <span>•</span>
                            <span>{payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM dd, yyyy') : ''}</span>
                          </div>
                          {payment.notes && <p className="text-sm mt-2 text-muted-foreground italic">"{payment.notes}"</p>}
                        </div>
                      </div>
                      <Button variant="outline" className="shrink-0 hover-elevate" onClick={() => handlePrint(payment)}>
                        Print Receipt
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <PaymentFormDialog 
        open={paymentOpen} 
        onOpenChange={setPaymentOpen} 
        prefilledStudentId={student.id} 
      />
    </div>
  );
}
