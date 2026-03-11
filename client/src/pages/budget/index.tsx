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
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown, Minus, Loader2, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { Budget } from "@shared/schema";
import { useBranding } from "@/hooks/use-branding";
import { generateDetailedBudgetReportPDF } from "@/lib/pdf-reports";

const EXPENSE_CATEGORIES = ["Rent", "Maintenance", "Security", "Salaries", "Utilities", "Supplies", "Transport", "Other"];
const TERMS = ["Term 1", "Term 2", "Term 3"];

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

function getStatusBadge(status: string) {
  if (status === "Over Budget") return <Badge className="bg-red-50 text-red-700 border border-red-200 rounded-full text-xs" data-testid="badge-status-over">{status}</Badge>;
  if (status === "On Budget") return <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full text-xs" data-testid="badge-status-on">{status}</Badge>;
  return <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs" data-testid="badge-status-under">{status}</Badge>;
}

export default function BudgetPage() {
  const { user } = useAuth();
  const { data: branding } = useBranding();
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
          <p className="text-muted-foreground mt-1 text-sm">Set and monitor term budgets against actual expenses</p>
        </div>
        {canEdit && (
          <Button onClick={openCreateForm} className="rounded-xl font-semibold shadow-sm" data-testid="button-add-budget">
            <Plus className="mr-2 h-5 w-5" /> Add Budget Item
          </Button>
        )}
      </div>

      <div className="flex flex-row flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Term</Label>
          <Select value={term} onValueChange={setTerm} data-testid="select-term">
            <SelectTrigger className="w-[140px] rounded-xl" data-testid="select-term-trigger">
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
            className="w-[160px] rounded-xl"
            data-testid="input-academic-year"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm rounded-2xl border-border/40 border-l-4 border-l-primary p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Budget (UGX)</p>
          <p className="text-2xl font-display font-bold mt-2" data-testid="text-budget-total-ugx">{formatCurrency(totalEstimatedUGX, "UGX")}</p>
        </Card>
        <Card className="shadow-sm rounded-2xl border-border/40 border-l-4 border-l-emerald-500 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Budget (USD)</p>
          <p className="text-2xl font-display font-bold mt-2" data-testid="text-budget-total-usd">{formatCurrency(totalEstimatedUSD, "USD")}</p>
        </Card>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="rounded-xl bg-muted/60 p-1" data-testid="tabs-budget">
          <TabsTrigger value="items" className="rounded-lg" data-testid="tab-budget-items">Budget Items</TabsTrigger>
          <TabsTrigger value="comparison" className="rounded-lg" data-testid="tab-budget-comparison">Budget vs Actual</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card className="shadow-sm rounded-2xl border-border/40 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Category</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Currency</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide text-right">Estimated Amount</TableHead>
                  {canEdit && <TableHead className="w-[100px] text-right"></TableHead>}
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
                    <TableRow key={item.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-budget-${item.id}`}>
                      <TableCell>
                        <Badge variant="outline" className={`rounded-lg ${categoryColors[item.category] || categoryColors.Other}`}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{item.currency}</TableCell>
                      <TableCell className="text-right font-bold text-sm">{formatCurrency(item.estimatedAmount, item.currency)}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => openEditForm(item)} data-testid={`button-edit-budget-${item.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8" onClick={() => deleteMutation.mutate(item.id)} disabled={deleteMutation.isPending} data-testid={`button-delete-budget-${item.id}`}>
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
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={!comparison?.length}
              onClick={() => comparison && generateDetailedBudgetReportPDF(
                comparison.map(r => ({
                  category: r.category,
                  estimated: r.estimated,
                  actual: r.actual,
                  variance: r.variance,
                  status: r.status,
                  currency: r.currency,
                })),
                { term, academicYear },
                branding
              )}
              data-testid="button-budget-report-pdf"
            >
              <FileText className="mr-2 h-4 w-4" />
              Budget Report PDF
            </Button>
          </div>
          <Card className="shadow-sm rounded-2xl border-border/40 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">Category</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide text-right">Estimated</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide text-right">Actual</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide text-right">Variance</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide text-center">Status</TableHead>
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
                    <TableRow key={idx} className="hover:bg-muted/20 transition-colors" data-testid={`row-comparison-${idx}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`rounded-lg ${categoryColors[row.category] || categoryColors.Other}`}>
                            {row.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">({row.currency})</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">{formatCurrency(row.estimated, row.currency)}</TableCell>
                      <TableCell className="text-right font-medium text-sm">{formatCurrency(row.actual, row.currency)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-bold text-sm flex items-center justify-end gap-1 ${row.variance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
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
            <Card className="shadow-sm rounded-2xl border-border/40 p-6">
              <h3 className="font-display font-semibold text-foreground mb-4" data-testid="text-chart-title">Estimated vs Actual by Category</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="category" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "13px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Legend />
                    <Bar dataKey="Estimated" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Actual" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="rounded-2xl" data-testid="dialog-budget-form">
          <DialogHeader>
            <DialogTitle className="font-display">{editingBudget ? "Edit Budget Item" : "Add Budget Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger className="rounded-xl" data-testid="select-budget-category">
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
                className="rounded-xl"
                data-testid="input-budget-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={formCurrency} onValueChange={setFormCurrency}>
                <SelectTrigger className="rounded-xl" data-testid="select-budget-currency">
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
            <Button variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl" data-testid="button-cancel-budget">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl"
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
