import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useBranding } from "@/hooks/use-branding";
import { generateFinancialReportPDF, type FinancialSummary } from "@/lib/pdf-reports";

export default function ReportsPage() {
  const [period, setPeriod] = useState("monthly");
  const [term, setTerm] = useState<string | undefined>(undefined);
  const { data: branding } = useBranding();

  const queryParams = new URLSearchParams({ period });
  if (period === "termly" && term) queryParams.set("term", term);
  const queryUrl = `/api/reports/financial-summary?${queryParams.toString()}`;

  const { data, isLoading } = useQuery<FinancialSummary>({
    queryKey: [queryUrl],
  });

  const handleDownloadPDF = () => {
    if (!data) return;
    generateFinancialReportPDF(data, branding);
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-reports-title">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">View and download financial summaries</p>
        </div>
        <Button onClick={handleDownloadPDF} disabled={!data || isLoading} data-testid="button-download-pdf">
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Tabs value={period} onValueChange={setPeriod} data-testid="tabs-period">
          <TabsList>
            <TabsTrigger value="weekly" data-testid="tab-weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">Monthly</TabsTrigger>
            <TabsTrigger value="termly" data-testid="tab-termly">Termly</TabsTrigger>
          </TabsList>
        </Tabs>

        {period === "termly" && (
          <Select value={term || ""} onValueChange={(v) => setTerm(v || undefined)} data-testid="select-term">
            <SelectTrigger className="w-36" data-testid="select-term-trigger">
              <SelectValue placeholder="All Terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Term 1" data-testid="select-term-1">Term 1</SelectItem>
              <SelectItem value="Term 2" data-testid="select-term-2">Term 2</SelectItem>
              <SelectItem value="Term 3" data-testid="select-term-3">Term 3</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="summary-cards">
            <Card data-testid="card-total-income">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold" data-testid="text-income-ugx">{formatCurrency(data.totalIncome.UGX, "UGX")}</div>
                {data.totalIncome.USD > 0 && (
                  <div className="text-sm text-muted-foreground" data-testid="text-income-usd">{formatCurrency(data.totalIncome.USD, "USD")}</div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-total-expenses">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold" data-testid="text-expenses-ugx">{formatCurrency(data.totalExpenses.UGX, "UGX")}</div>
                {data.totalExpenses.USD > 0 && (
                  <div className="text-sm text-muted-foreground" data-testid="text-expenses-usd">{formatCurrency(data.totalExpenses.USD, "USD")}</div>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-net-balance">
              <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Balance</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${data.netBalance.UGX >= 0 ? "text-emerald-600" : "text-red-600"}`} data-testid="text-balance-ugx">
                  {formatCurrency(data.netBalance.UGX, "UGX")}
                </div>
                {(data.netBalance.USD !== 0) && (
                  <div className={`text-sm ${data.netBalance.USD >= 0 ? "text-emerald-600" : "text-red-600"}`} data-testid="text-balance-usd">
                    {formatCurrency(data.netBalance.USD, "USD")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {data.incomeByFeeType.length > 0 && (
            <Card data-testid="card-income-by-fee-type">
              <CardHeader>
                <CardTitle className="text-base">Income by Fee Type</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.incomeByFeeType.map((item, i) => (
                      <TableRow key={i} data-testid={`row-income-${i}`}>
                        <TableCell>{item.feeType}</TableCell>
                        <TableCell>{item.currency}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.amount, item.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.expensesByCategory.length > 0 && (
            <Card data-testid="card-expenses-by-category">
              <CardHeader>
                <CardTitle className="text-base">Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.expensesByCategory.map((item, i) => (
                      <TableRow key={i} data-testid={`row-expense-${i}`}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{item.currency}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.amount, item.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {data.incomeByFeeType.length === 0 && data.expensesByCategory.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No financial data found for this period.
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
