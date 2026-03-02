import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

export function ReceiptPrint({ payment, student }: { payment: any, student: any }) {
  if (!payment || !student) return null;

  return (
    <div id="print-receipt-section" className="print-only hidden">
      <div className="max-w-2xl mx-auto border-2 border-slate-200 p-10 rounded-xl bg-white font-sans text-slate-900">
        <div className="flex justify-between items-start border-b-2 border-slate-100 pb-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-slate-900 rounded-2xl flex items-center justify-center">
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">HelioPay System</h1>
              <p className="text-slate-500 mt-1">Official Payment Receipt</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Receipt No.</p>
            <p className="text-xl font-mono font-bold text-slate-900">{payment.receiptNumber}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
            <h3 className="text-xl font-bold">{student.fullName}</h3>
            <p className="text-slate-600 mt-1">Admission: <span className="font-mono">{student.admissionNumber}</span></p>
            <p className="text-slate-600">Class: {student.classGrade}</p>
            <p className="text-slate-600">Academic Year: {student.academicYear}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Payment Details</p>
            <p className="text-slate-600">Date: {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMMM dd, yyyy') : 'N/A'}</p>
            {payment.term && <p className="text-slate-600">Term: {payment.term}</p>}
            {payment.feeType && <p className="text-slate-600">Fee Type: {payment.feeType}</p>}
            <p className="text-slate-600">Recorded By: {payment.recordedBy}</p>
            {payment.notes && <p className="text-slate-600 mt-2 italic text-sm">{payment.notes}</p>}
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-6 mb-12 flex justify-between items-center border border-slate-100">
          <span className="text-lg font-bold text-slate-600 uppercase tracking-wider">Amount Received</span>
          <span className="text-4xl font-bold text-slate-900">{formatCurrency(payment.amount, payment.currency)}</span>
        </div>

        <div className="border-t-2 border-slate-100 pt-8 flex justify-between items-end">
          <div className="text-sm text-slate-500">
            <p>Thank you for your payment.</p>
            <p>This is a computer-generated document.</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b-2 border-slate-800 pb-2 mb-2"></div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
