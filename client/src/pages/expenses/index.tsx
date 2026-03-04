import { useState } from "react";
import { useExpenses, useDeleteExpense } from "@/hooks/use-expenses";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Trash2, FileDown } from "lucide-react";
import { ExpenseFormDialog } from "@/components/expense-form-dialog";
import { generateExpenseReceiptPDF } from "@/lib/pdf-receipts";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const categoryColors: Record<string, string> = {
  Rent: "bg-blue-500/10 text-blue-700 border-blue-200",
  Maintenance: "bg-amber-500/10 text-amber-700 border-amber-200",
  Security: "bg-red-500/10 text-red-700 border-red-200",
  Salaries: "bg-purple-500/10 text-purple-700 border-purple-200",
  Utilities: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
  Supplies: "bg-green-500/10 text-green-700 border-green-200",
  Transport: "bg-indigo-500/10 text-indigo-700 border-indigo-200",
  Other: "bg-gray-500/10 text-gray-700 border-gray-200",
};

export default function ExpensesPage() {
  const { data: expenses, isLoading } = useExpenses();
  const { data: branding } = useBranding();
  const { user } = useAuth();
  const canEdit = (user as any)?.role !== "Principal";
  const deleteMutation = useDeleteExpense();
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredExpenses = expenses?.filter(
    (e) =>
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      e.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalUGX = expenses?.filter((e) => e.currency === "UGX").reduce((sum, e) => sum + e.amount, 0) || 0;
  const totalUSD = expenses?.filter((e) => e.currency === "USD").reduce((sum, e) => sum + e.amount, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-expenses-title">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track school operating costs and expenditures</p>
        </div>
        {canEdit && (
          <Button onClick={() => setFormOpen(true)} className="hover-elevate shadow-lg shadow-orange-500/20 font-semibold h-11 px-6 bg-gradient-to-r from-orange-600 to-orange-500" data-testid="button-record-expense">
            <Plus className="mr-2 h-5 w-5" /> Record Expense
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm border-border/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Expenses (UGX)</p>
          <p className="text-xl font-display font-bold text-red-600 mt-1" data-testid="text-total-ugx">{formatCurrency(totalUGX, "UGX")}</p>
        </Card>
        <Card className="shadow-sm border-border/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Expenses (USD)</p>
          <p className="text-xl font-display font-bold text-red-600 mt-1" data-testid="text-total-usd">{formatCurrency(totalUSD, "USD")}</p>
        </Card>
      </div>

      <Card className="shadow-md border-border/50 overflow-hidden">
        <div className="p-4 border-b border-border/50 bg-muted/20">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by category or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-background border-border/50 focus-visible:ring-primary/20"
              data-testid="input-search-expenses"
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">Date</TableHead>
              <TableHead className="font-semibold text-foreground">Category</TableHead>
              <TableHead className="font-semibold text-foreground">Term</TableHead>
              <TableHead className="font-semibold text-foreground">Description</TableHead>
              <TableHead className="font-semibold text-foreground">Recorded By</TableHead>
              <TableHead className="font-semibold text-foreground text-right">Amount</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
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
                <TableRow key={expense.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-expense-${expense.id}`}>
                  <TableCell className="text-muted-foreground">
                    {expense.expenseDate ? format(new Date(expense.expenseDate), "MMM dd, yyyy") : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={categoryColors[expense.category] || categoryColors.Other}>
                      {expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{expense.term || "—"}</TableCell>
                  <TableCell className="font-medium text-foreground max-w-xs truncate">{expense.description}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{expense.recordedBy}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-red-600 bg-red-500/10 px-3 py-1 rounded-full border border-red-200">
                      -{formatCurrency(expense.amount, expense.currency)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:text-blue-600"
                      onClick={() => generateExpenseReceiptPDF(expense, branding)}
                      title="Download PDF"
                      data-testid={`button-pdf-expense-${expense.id}`}
                    >
                      <FileDown className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-red-600"
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
