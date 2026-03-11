import { useState } from "react";
import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Trash2, FileDown, FileText } from "lucide-react";
import { ExpenseFormDialog } from "@/components/expense-form-dialog";
import { generateExpenseReceiptPDF } from "@/lib/pdf-receipts";
import { generateDetailedExpenseReportPDF } from "@/lib/pdf-reports";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const categoryColors: Record<string, string> = {
  Rent: "bg-blue-50 text-blue-700 border-blue-200",
  Maintenance: "bg-amber-50 text-amber-700 border-amber-200",
  Security: "bg-red-50 text-red-700 border-red-200",
  Salaries: "bg-purple-50 text-purple-700 border-purple-200",
  Utilities: "bg-cyan-50 text-cyan-700 border-cyan-200",
  Supplies: "bg-green-50 text-green-700 border-green-200",
  Transport: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Other: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const { data: branding } = useBranding();
  const { user } = useAuth();
  const canEdit = (user as any)?.role !== "Principal";
  const deleteMutation = useDeleteExpense();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [reportTerm, setReportTerm] = useState<string>("all");
  const [reportCurrency, setReportCurrency] = useState<string>("all");

  const filteredExpenses = expenses?.filter(
    (e) =>
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalUGX = expenses?.filter((e) => e.currency === "UGX").reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalUSD = expenses?.filter((e) => e.currency === "USD").reduce((sum, e) => sum + e.amount, 0) || 0;

  const handleDetailedReport = () => {
    if (!expenses || expenses.length === 0) return;
    let filtered = expenses;
    if (reportTerm && reportTerm !== "all") filtered = filtered.filter(e => e.term === reportTerm);
    if (reportCurrency && reportCurrency !== "all") filtered = filtered.filter(e => e.currency === reportCurrency);

    generateDetailedExpenseReportPDF(
      filtered.map(e => ({
        expenseDate: e.expenseDate ? String(e.expenseDate) : null,
        category: e.category,
        description: e.description,
        recordedBy: e.recordedBy,
        amount: e.amount,
        currency: e.currency,
        term: e.term,
      })),
      {
        term: reportTerm !== "all" ? reportTerm : undefined,
        currency: reportCurrency !== "all" ? reportCurrency : undefined,
      },
      branding
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-expenses-title">Expenses</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track school operating costs and expenditures</p>
        </div>
        {canEdit && (
          <Button onClick={() => setFormOpen(true)} className="rounded-xl font-semibold h-11 px-6 shadow-sm" data-testid="button-record-expense">
            <Plus className="mr-2 h-5 w-5" /> Record Expense
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm rounded-2xl border-border/40 border-l-4 border-l-red-400 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Expenses (UGX)</p>
          <p className="text-2xl font-display font-bold text-red-500 mt-2" data-testid="text-total-ugx">{formatCurrency(totalUGX, "UGX")}</p>
        </Card>
        <Card className="shadow-sm rounded-2xl border-border/40 border-l-4 border-l-red-400 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Expenses (USD)</p>
          <p className="text-2xl font-display font-bold text-red-500 mt-2" data-testid="text-total-usd">{formatCurrency(totalUSD, "USD")}</p>
        </Card>
      </div>

      {/* Report export controls */}
      <div className="flex flex-wrap items-center gap-3" data-testid="expense-report-controls">
        <Select value={reportTerm} onValueChange={setReportTerm}>
          <SelectTrigger className="w-[140px] h-9 rounded-xl" data-testid="select-expense-report-term">
            <SelectValue placeholder="All Terms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Terms</SelectItem>
            <SelectItem value="Term 1">Term 1</SelectItem>
            <SelectItem value="Term 2">Term 2</SelectItem>
            <SelectItem value="Term 3">Term 3</SelectItem>
          </SelectContent>
        </Select>
        <Select value={reportCurrency} onValueChange={setReportCurrency}>
          <SelectTrigger className="w-[140px] h-9 rounded-xl" data-testid="select-expense-report-currency">
            <SelectValue placeholder="All Currencies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Currencies</SelectItem>
            <SelectItem value="UGX">UGX</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDetailedReport}
          disabled={!expenses?.length}
          className="rounded-xl"
          data-testid="button-detailed-expense-report"
        >
          <FileText className="mr-2 h-4 w-4" />
          Detailed Report PDF
        </Button>
      </div>

      <Card className="shadow-sm rounded-2xl border-border/40 overflow-hidden">
        <div className="p-4 border-b border-border/30 bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by category or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 bg-background rounded-xl border-border/40 focus-visible:ring-primary/20"
              data-testid="input-search-expenses"
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Date</TableHead>
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Category</TableHead>
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Term</TableHead>
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Description</TableHead>
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Recorded By</TableHead>
              <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide text-right">Amount</TableHead>
              <TableHead className="w-[100px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">Loading expenses...</TableCell>
              </TableRow>
            ) : filteredExpenses?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">No expenses found.</TableCell>
              </TableRow>
            ) : (
              filteredExpenses?.map((expense) => (
                <TableRow key={expense.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-expense-${expense.id}`}>
                  <TableCell className="text-muted-foreground text-sm">
                    {expense.expenseDate ? format(new Date(expense.expenseDate), "MMM dd, yyyy") : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-lg ${categoryColors[expense.category] || categoryColors.Other}`}>
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{expense.term || "—"}</TableCell>
                  <TableCell className="font-medium text-foreground max-w-xs truncate text-sm">{expense.description}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{expense.recordedBy}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-xl text-sm border border-red-100">
                      -{formatCurrency(expense.amount, expense.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl h-8 w-8"
                      onClick={() => generateExpenseReceiptPDF(expense, branding)}
                      title="Download Voucher PDF"
                      data-testid={`button-pdf-expense-${expense.id}`}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-red-600 rounded-xl h-8 w-8"
                        onClick={() => deleteMutation.mutate(expense.id)}
                        disabled={deleteMutation.isPending}
                        title="Delete Expense"
                        data-testid={`button-delete-expense-${expense.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <ExpenseFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
}
