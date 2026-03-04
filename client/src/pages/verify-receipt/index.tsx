import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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

export default function VerifyReceiptPage() {
  const [receiptNumber, setReceiptNumber] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  async function handleVerify() {
    const trimmed = receiptNumber.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/verify-receipt?receiptNumber=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error("Failed to verify");
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ valid: false });
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleVerify();
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold" data-testid="text-verify-heading">
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
              onKeyDown={handleKeyDown}
            />
            <Button
              data-testid="button-verify"
              onClick={handleVerify}
              disabled={isLoading || !receiptNumber.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">Verify</span>
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {!isLoading && hasSearched && result && (
            <div data-testid="verify-result">
              {result.valid && result.payment && result.student ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-200 dark:border-green-900">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-green-800 dark:text-green-300" data-testid="text-valid-status">
                        Valid Receipt
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        This receipt is authentic and verified.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <DetailRow label="Student Name" value={result.student.fullName} testId="text-student-name" />
                    <DetailRow label="Admission No." value={result.student.admissionNumber} testId="text-admission-number" />
                    <DetailRow label="Class" value={result.student.classGrade} testId="text-class-grade" />
                    <DetailRow
                      label="Amount"
                      value={formatCurrency(result.payment.amount, result.payment.currency)}
                      testId="text-amount"
                    />
                    <DetailRow label="Fee Type" testId="text-fee-type">
                      <Badge variant="secondary">{result.payment.feeType}</Badge>
                    </DetailRow>
                    <DetailRow label="Term" value={result.payment.term} testId="text-term" />
                    <DetailRow
                      label="Date"
                      value={new Date(result.payment.paymentDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                      testId="text-date"
                    />
                    <DetailRow label="Receipt No." value={result.payment.receiptNumber} testId="text-receipt-number" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-md border border-red-200 dark:border-red-900">
                  <XCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800 dark:text-red-300" data-testid="text-invalid-status">
                      Invalid Receipt
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400">
                      No payment found with this receipt number.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
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
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
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
