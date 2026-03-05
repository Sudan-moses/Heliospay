import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, CreditCard, AlertCircle, Wallet, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import { useStudents } from "@/hooks/use-students";
import { usePayments } from "@/hooks/use-payments";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const { data: students, isLoading: loadingStudents } = useStudents();
  const { data: payments, isLoading: loadingPayments } = usePayments();

  const showFinancialHealth = user?.role === "Admin" || user?.role === "Principal";

  const { data: financialSummary, isLoading: loadingFinancial } = useQuery<{
    totalIncome: { UGX: number; USD: number };
    totalExpenses: { UGX: number; USD: number };
    netBalance: { UGX: number; USD: number };
    period: string;
    startDate: string;
    endDate: string;
  }>({
    queryKey: [`/api/reports/financial-summary?period=termly&term=${encodeURIComponent(selectedTerm)}`],
    enabled: showFinancialHealth,
  });

  if (loadingStudents || loadingPayments) {
    return <div className="h-[50vh] flex items-center justify-center"><div className="animate-pulse flex flex-col items-center"><div className="h-8 w-8 bg-primary rounded-full animate-bounce" /><p className="mt-4 text-muted-foreground font-medium">Loading Dashboard...</p></div></div>;
  }

  const activeStudents = students?.filter(s => s.status === 'Active') || [];
  const totalStudents = students?.length || 0;
  
  const totalCollectedUGX = payments?.filter(p => p.currency === 'UGX').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const totalCollectedUSD = payments?.filter(p => p.currency === 'USD').reduce((acc, curr) => acc + curr.amount, 0) || 0;
  
  const totalExpectedUGX = activeStudents.filter(s => s.currency === 'UGX').reduce((acc, curr) => acc + curr.tuitionFee, 0);
  const totalOutstandingUGX = activeStudents.filter(s => s.currency === 'UGX').reduce((acc, curr) => acc + curr.remainingBalance, 0);
  
  const totalExpectedUSD = activeStudents.filter(s => s.currency === 'USD').reduce((acc, curr) => acc + curr.tuitionFee, 0);
  const totalOutstandingUSD = activeStudents.filter(s => s.currency === 'USD').reduce((acc, curr) => acc + curr.remainingBalance, 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      date: format(d, 'MMM dd'),
      rawDate: format(d, 'yyyy-MM-dd'),
      amount: 0
    };
  });

  payments?.filter(p => p.currency === 'UGX').forEach(p => {
    if (!p.paymentDate) return;
    const pDate = format(new Date(p.paymentDate), 'yyyy-MM-dd');
    const day = last7Days.find(d => d.rawDate === pDate);
    if (day) {
      day.amount += p.amount;
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm">Plan, prioritize, and manage your school finances with ease.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Total Students" 
          value={totalStudents.toString()} 
          subtitle={`${activeStudents.length} currently active`}
          icon={<Users className="h-5 w-5" />}
          accentColor="bg-emerald-50 text-emerald-600"
          borderColor="border-l-emerald-500"
        />
        <MetricCard 
          title="Total Collected" 
          value={formatCurrency(totalCollectedUGX, 'UGX')} 
          subtitle={`${formatCurrency(totalCollectedUSD, 'USD')} also collected`}
          icon={<Wallet className="h-5 w-5" />}
          accentColor="bg-green-50 text-green-600"
          borderColor="border-l-green-500"
        />
        <MetricCard 
          title="Total Expected" 
          value={formatCurrency(totalExpectedUGX, 'UGX')} 
          subtitle={`${formatCurrency(totalExpectedUSD, 'USD')} expected in USD`}
          icon={<CreditCard className="h-5 w-5" />}
          accentColor="bg-teal-50 text-teal-600"
          borderColor="border-l-teal-500"
        />
        <MetricCard 
          title="Outstanding Balance" 
          value={formatCurrency(totalOutstandingUGX, 'UGX')} 
          subtitle={`${formatCurrency(totalOutstandingUSD, 'USD')} outstanding in USD`}
          icon={<AlertCircle className="h-5 w-5" />}
          accentColor="bg-amber-50 text-amber-600"
          borderColor="border-l-amber-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="col-span-1 lg:col-span-2 shadow-sm rounded-2xl border-border/40">
          <CardHeader className="pb-2 pt-5 px-6">
            <CardTitle className="text-base font-display font-semibold">UGX Collections (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-6 pb-6">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `${(val/1000)}k`}
                    tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}}
                    dx={-10}
                  />
                  <Tooltip 
                    cursor={{fill: 'hsl(var(--muted))', opacity: 0.3}}
                    contentStyle={{borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-md)', fontSize: '13px'}}
                    formatter={(value: number) => [formatCurrency(value, 'UGX'), 'Amount']}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-2xl border-border/40">
          <CardHeader className="pb-2 pt-5 px-6">
            <CardTitle className="text-base font-display font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 px-0 pb-2">
            <div className="space-y-0">
              {payments?.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-3 px-6 hover:bg-muted/40 transition-colors rounded-lg mx-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {payment.studentName?.charAt(0) || "S"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-semibold truncate text-foreground">{payment.studentName}</span>
                      <span className="text-xs text-muted-foreground font-mono">{payment.receiptNumber}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <span className="text-sm font-bold text-emerald-600">+{formatCurrency(payment.amount, payment.currency)}</span>
                    <span className="text-xs text-muted-foreground">
                      {payment.paymentDate ? format(new Date(payment.paymentDate), 'MMM dd') : ''}
                    </span>
                  </div>
                </div>
              ))}
              {(!payments || payments.length === 0) && (
                <div className="text-center py-8 text-muted-foreground text-sm">No recent payments.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {showFinancialHealth && (
        <div data-testid="section-financial-health">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <h2 className="text-base font-display font-semibold text-foreground">Term Financial Health</h2>
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[140px] h-9 rounded-xl" data-testid="select-term-financial">
                <SelectValue placeholder="Select term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loadingFinancial ? (
            <Card className="shadow-sm rounded-2xl border-border/40">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ) : financialSummary ? (
            <Card className="shadow-sm rounded-2xl border-border/40" data-testid="card-term-financial-health">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100" data-testid="financial-revenue">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Revenue</span>
                    </div>
                    <p className="text-xl font-bold text-foreground" data-testid="text-revenue-ugx">
                      {formatCurrency(financialSummary.totalIncome.UGX, "UGX")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="text-revenue-usd">
                      {formatCurrency(financialSummary.totalIncome.USD, "USD")}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-red-50 border border-red-100" data-testid="financial-expenses">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-red-500">Expenses</span>
                    </div>
                    <p className="text-xl font-bold text-foreground" data-testid="text-expenses-ugx">
                      {formatCurrency(financialSummary.totalExpenses.UGX, "UGX")}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="text-expenses-usd">
                      {formatCurrency(financialSummary.totalExpenses.USD, "USD")}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10" data-testid="financial-net-profit">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">Net Profit</span>
                    </div>
                    <p
                      className={`text-xl font-bold ${financialSummary.netBalance.UGX >= 0 ? "text-emerald-600" : "text-destructive"}`}
                      data-testid="text-net-profit-ugx"
                    >
                      {formatCurrency(financialSummary.netBalance.UGX, "UGX")}
                    </p>
                    <p
                      className={`text-sm mt-1 ${financialSummary.netBalance.USD >= 0 ? "text-emerald-600" : "text-destructive"}`}
                      data-testid="text-net-profit-usd"
                    >
                      {formatCurrency(financialSummary.netBalance.USD, "USD")}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40">
                  <p className="text-sm text-muted-foreground text-center" data-testid="text-profit-formula">
                    <span className="font-medium text-foreground">Revenue</span>
                    {" - "}
                    <span className="font-medium text-foreground">Expenses</span>
                    {" = "}
                    <span className={`font-bold ${financialSummary.netBalance.UGX >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      Net Profit
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-sm rounded-2xl border-border/40">
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground text-sm" data-testid="text-no-financial-data">
                  No financial data available for {selectedTerm}.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, accentColor, borderColor }: { title: string, value: string, subtitle: string, icon: React.ReactNode, accentColor: string, borderColor: string }) {
  return (
    <Card className={`shadow-sm rounded-2xl border-border/40 border-l-4 ${borderColor} hover:shadow-md transition-all duration-300`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
          <div className={`h-9 w-9 rounded-xl ${accentColor} flex items-center justify-center shrink-0`}>
            {icon}
          </div>
        </div>
        <p className="text-2xl font-display font-bold text-foreground mt-2 truncate">{value}</p>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <ArrowUpRight className="h-3 w-3 text-emerald-500" />
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}
