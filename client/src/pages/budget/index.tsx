import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBudgets, useCreateBudget, useUpdateBudget, useDeleteBudget, useBudgetVsActual } from "@/hooks/use-budgets";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Budget } from "@shared/schema";

const EXPENSE_CATEGORIES = ["Rent", "Maintenance", "Security", "Salaries", "Utilities", "Supplies", "Transport", "Other"];
const TERMS = ["Term 1", "Term 2", "Term 3"];

const categoryColors: Record<string, string> = {
  Rent: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Maintenance: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  Security: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
  Salaries: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  Utilities: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800",
  Supplies: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  Transport: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  Other: "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-800",
};

function getStatusBadge(status: string) {
  if (status === "Over Budget") return <Badge variant="outline" className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800" data-testid="badge-status-over">{status}</Badge>;
  if (status === "On Budget") return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800" data-testid="badge-status-on">{status}</Badge>;
  return <Badge variant="outline" className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" data-testid="badge-status-under">{status}</Badge>;
}

export default function BudgetPage() {
  const { user } = useAuth();
  const canEdit = (user as any)?.role !== "Principal";

  const [term, setTerm] = useState("Term 1");
  const [academicYear, setAcademicYear] = useState("2023/2024");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [formCategory, setFormCategory] = useState("Rent");
  const [formAmount, setFormAmount] = useState("");
  const [formCurrency, setFormCurrency] = useState("UGX");

  const { data: budgetItems, isLoading: budgetsLoading } = useBudgets(term, academicYear);
  const { data: comparison, isLoading: comparisonLoading } = useBudgetVsActual(term, academicYear);
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const openCreateForm = () => {
    setEditingBudget(null);
    setFormCategory("Rent");
    setFormAmount("");
    setFormCurrency("UGX");
    setFormOpen(true);
  };

  const openEditForm = (budget: Budget) => {
    setEditingBudget(budget);
    setFormCategory(budget.category);
    setFormAmount(String(budget.estimatedAmount));
    setFormCurrency(budget.currency);
    setFormOpen(true);
  };

  const handleSubmit = () => {
    const amount = Number(formAmount);
    if (!amount || amount <= 0) return;

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data: { category: formCategory, estimatedAmount: amount, currency: formCurrency } }, {
        onSuccess: () => setFormOpen(false),
      });
    } else {
      createMutation.mutate({ term, academicYear, category: formCategory, estimatedAmount: amount, currency: formCurrency }, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const chartData = comparison?.map((c) => ({
    category: c.category,
    Estimated: c.estimated,
    Actual: c.actual,
    currency: c.currency,
  })) || [];

  const totalEstimatedUGX = budgetItems?.filter(b => b.currency === "UGX").reduce((s, b) => s + b.estimatedAmount, 0) || 0;
  const totalEstimatedUSD = budgetItems?.filter(b => b.currency === "USD").reduce((s, b) => s + b.estimatedAmount, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-budget-title">Budget Tracking</h1>
          <p className="text-muted-foreground mt-1">Set and monitor term budgets against actual expenses</p>
        </div>
        {canEdit && (
          <Button onClick={openCreateForm} data-testid="button-add-budget">
            <Plus className="mr-2 h-5 w-5" /> Add Budget Item
          </Button>
        )}
      </div>

      <div className="flex flex-row flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Term</Label>
          <Select value={term} onValueChange={setTerm} data-testid="select-term">
            <SelectTrigger className="w-[140px]" data-testid="select-term-trigger">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Academic Year</Label>
          <Input
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="e.g. 2023/2024"
            className="w-[160px]"
            data-testid="input-academic-year"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm border-border/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Budget (UGX)</p>
          <p className="text-xl font-display font-bold mt-1" data-testid="text-budget-total-ugx">{formatCurrency(totalEstimatedUGX, "UGX")}</p>
        </Card>
        <Card className="shadow-sm border-border/50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Budget (USD)</p>
          <p className="text-xl font-display font-bold mt-1" data-testid="text-budget-total-usd">{formatCurrency(totalEstimatedUSD, "USD")}</p>
        </Card>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList data-testid="tabs-budget">
          <TabsTrigger value="items" data-testid="tab-budget-items">Budget Items</TabsTrigger>
          <TabsTrigger value="comparison" data-testid="tab-budget-comparison">Budget vs Actual</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card className="shadow-md border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-foreground">Category</TableHead>
                  <TableHead className="font-semibold text-foreground">Currency</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Estimated Amount</TableHead>
                  {canEdit && <TableHead className="w-[100px] text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {budgetsLoading ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 4 : 3} className="h-48 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : !budgetItems?.length ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 4 : 3} className="h-48 text-center text-muted-foreground">
                      No budget items for {term} {academicYear}.
                    </TableCell>
                  </TableRow>
                ) : (
                  budgetItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors" data-testid={`row-budget-${item.id}`}>
                      <TableCell>
                        <Badge variant="outline" className={categoryColors[item.category] || categoryColors.Other}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.currency}</TableCell>
                      <TableCell className="text-right font-bold">{formatCurrency(item.estimatedAmount, item.currency)}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEditForm(item)} data-testid={`button-edit-budget-${item.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-budget-${item.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card className="shadow-md border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-foreground">Category</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Estimated</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Actual</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Variance</TableHead>
                  <TableHead className="font-semibold text-foreground text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : !comparison?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                      No budget data for comparison. Add budget items first.
                    </TableCell>
                  </TableRow>
                ) : (
                  comparison.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30 transition-colors" data-testid={`row-comparison-${idx}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={categoryColors[row.category] || categoryColors.Other}>
                            {row.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">({row.currency})</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(row.estimated, row.currency)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(row.actual, row.currency)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold flex items-center justify-end gap-1 ${row.variance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {row.variance > 0 && <TrendingDown className="h-4 w-4" />}
                          {row.variance < 0 && <TrendingUp className="h-4 w-4" />}
                          {row.variance === 0 && <Minus className="h-4 w-4" />}
                          {formatCurrency(Math.abs(row.variance), row.currency)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{getStatusBadge(row.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>

          {chartData.length > 0 && (
            <Card className="shadow-md border-border/50 p-6">
              <h3 className="font-display font-bold text-foreground mb-4" data-testid="text-chart-title">Estimated vs Actual by Category</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="category" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "6px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Bar dataKey="Estimated" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Actual" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent data-testid="dialog-budget-form">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Edit Budget Item" : "Add Budget Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger data-testid="select-budget-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estimated Amount</Label>
              <Input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="Enter amount"
                min={0}
                data-testid="input-budget-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formCurrency} onValueChange={setFormCurrency}>
                <SelectTrigger data-testid="select-budget-currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UGX">UGX</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} data-testid="button-cancel-budget">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-save-budget"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingBudget ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
