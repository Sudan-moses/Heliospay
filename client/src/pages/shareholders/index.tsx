import { useState } from "react";
import { useShareholders, usePayouts, useCalculatePayouts } from "@/hooks/use-shareholders";
import { useBranding } from "@/hooks/use-branding";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calculator, FileDown, TrendingUp, Wallet, Users2, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { generateDividendReportPDF } from "@/lib/pdf-reports";

const TERMS = ["Term 1", "Term 2", "Term 3"];
const GREEN_PALETTE = ["#1B4332", "#2D6A4F", "#40916C", "#52B788", "#74C69D", "#95D5B2", "#B7E4C7", "#D8F3DC"];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function ShareholdersPage() {
  const { user } = useAuth();
  const { data: branding } = useBranding();
  const { data: shareholders, isLoading: loadingShareholders } = useShareholders();
  const calculateMutation = useCalculatePayouts();
  const { toast } = useToast();
  const isAdmin = (user as any)?.role === "Admin";

  const [term, setTerm] = useState("Term 1");
  const [academicYear, setAcademicYear] = useState("2023/2024");
  const [currency, setCurrency] = useState("UGX");
  const [calcResult, setCalcResult] = useState<null | {
    netProfit: number;
    currency: string;
    term: string;
    academicYear: string;
    payouts: any[];
    totalAllocated: number;
    retainedEarnings: number;
  }>(null);

  const { data: existingPayouts, isLoading: loadingPayouts } = usePayouts(term, academicYear, currency);

  const totalPercentage = shareholders?.reduce((sum, s) => sum + parseFloat(s.sharePercentage || "0"), 0) || 0;
  const remainingPct = 100 - totalPercentage;

  const pieData = [
    ...(shareholders || []).map((s, i) => ({
      name: s.name,
      value: parseFloat(s.sharePercentage),
      color: GREEN_PALETTE[i % GREEN_PALETTE.length],
    })),
    ...(remainingPct > 0.001 ? [{ name: "Retained / Unallocated", value: remainingPct, color: "#E9ECEF" }] : []),
  ];

  const handleCalculate = () => {
    calculateMutation.mutate({ term, academicYear, currency }, {
      onSuccess: (data) => {
        setCalcResult(data);
        toast({ title: "Profit distribution calculated", description: `Net profit: ${formatCurrency(data.netProfit, currency)}` });
      },
      onError: (e: any) => {
        toast({ title: "Calculation failed", description: e.message, variant: "destructive" });
      },
    });
  };

  const handleDownloadPDF = () => {
    const result = calcResult || (existingPayouts && existingPayouts.length > 0 ? {
      netProfit: existingPayouts[0]?.netProfit || 0,
      currency,
      term,
      academicYear,
      payouts: existingPayouts,
      totalAllocated: existingPayouts.reduce((s, p) => s + p.payoutAmount, 0),
      retainedEarnings: Math.max(0, (existingPayouts[0]?.netProfit || 0) - existingPayouts.reduce((s, p) => s + p.payoutAmount, 0)),
    } : null);

    if (!result) return toast({ title: "No data to export. Calculate payouts first.", variant: "destructive" });
    generateDividendReportPDF(result, branding);
  };

  const displayPayouts = calcResult?.payouts || existingPayouts || [];
  const displayNetProfit = calcResult?.netProfit ?? (existingPayouts?.[0]?.netProfit ?? null);
  const displayRetained = calcResult?.retainedEarnings ?? null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground" data-testid="text-shareholders-title">
            Shareholder Management
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Profit distribution based on ownership structure</p>
        </div>
        <Button variant="outline" className="rounded-xl" onClick={handleDownloadPDF} data-testid="button-download-dividend-pdf">
          <FileDown className="mr-2 h-4 w-4" /> Dividend Report PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-sm rounded-2xl border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" /> Ownership Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingShareholders ? (
              <div className="h-[260px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : shareholders?.length === 0 ? (
              <div className="h-[260px] flex flex-col items-center justify-center text-muted-foreground">
                <Users2 className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No shareholders</p>
                <p className="text-xs mt-1">Add shareholders in Settings</p>
              </div>
            ) : (
              <>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                        labelLine={false}
                        label={renderCustomLabel}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [`${val.toFixed(2)}%`, "Share"]}
                        contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {pieData.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                        <span className="truncate text-foreground font-medium max-w-[130px]">{entry.name}</span>
                      </div>
                      <span className="font-bold text-muted-foreground">{entry.value.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-5">
          <Card className="shadow-sm rounded-2xl border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" /> Calculate Profit Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Term</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger className="rounded-xl" data-testid="select-sh-term">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Academic Year</Label>
                  <Input
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 2023/2024"
                    className="rounded-xl"
                    data-testid="input-sh-year"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="rounded-xl" data-testid="select-sh-currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UGX">UGX</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isAdmin && (
                <Button
                  onClick={handleCalculate}
                  disabled={calculateMutation.isPending || !shareholders?.length}
                  className="rounded-xl w-full sm:w-auto"
                  data-testid="button-calculate-payouts"
                >
                  {calculateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calculator className="mr-2 h-4 w-4" />}
                  {calculateMutation.isPending ? "Calculating..." : "Calculate Profit Distribution"}
                </Button>
              )}
            </CardContent>
          </Card>

          {displayNetProfit !== null && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm rounded-2xl border-0 bg-gradient-to-br from-primary to-emerald-700 text-white">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-white/60" />
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">Net Profit</p>
                  </div>
                  <p className="text-2xl font-display font-bold" data-testid="text-sh-net-profit">
                    {formatCurrency(displayNetProfit, currency)}
                  </p>
                  <p className="text-white/50 text-xs mt-1">{term} · {academicYear}</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm rounded-2xl border-border/40 border-l-4 border-l-primary p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Total Allocated</p>
                <p className="text-2xl font-display font-bold text-primary" data-testid="text-sh-total-allocated">
                  {formatCurrency(displayPayouts.reduce((s: number, p: any) => s + p.payoutAmount, 0), currency)}
                </p>
              </Card>
              <Card className="shadow-sm rounded-2xl border-border/40 border-l-4 border-l-amber-400 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Retained Earnings</p>
                <p className="text-2xl font-display font-bold text-amber-600" data-testid="text-sh-retained">
                  {formatCurrency(displayRetained ?? Math.max(0, displayNetProfit - displayPayouts.reduce((s: number, p: any) => s + p.payoutAmount, 0)), currency)}
                </p>
              </Card>
            </div>
          )}

          <Card className="shadow-sm rounded-2xl border-border/40 overflow-hidden">
            <CardHeader className="bg-muted/20 border-b border-border/30 pb-4">
              <CardTitle className="font-display text-base">Dividend Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingPayouts && !calcResult ? (
                <div className="h-32 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
              ) : displayPayouts.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-muted-foreground">
                  <Wallet className="h-7 w-7 mb-2 opacity-40" />
                  <p className="text-sm font-medium">No payouts calculated yet</p>
                  <p className="text-xs mt-1">Select a term and click "Calculate Profit Distribution"</p>
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {displayPayouts.map((payout: any, idx: number) => (
                    <div key={payout.id || idx} className="flex items-center justify-between p-5 hover:bg-muted/10 transition-colors" data-testid={`row-payout-${payout.id || idx}`}>
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                          style={{ backgroundColor: GREEN_PALETTE[idx % GREEN_PALETTE.length] }}>
                          {(payout.shareholderName || "?").charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate" data-testid={`text-payout-name-${idx}`}>{payout.shareholderName}</p>
                          <Badge className="rounded-full bg-primary/10 text-primary border border-primary/20 text-xs mt-0.5 font-medium">
                            {parseFloat(payout.sharePercentage || "0").toFixed(2)}% ownership
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xl font-display font-bold text-primary" style={{ color: "#1B4332" }} data-testid={`text-payout-amount-${idx}`}>
                          {formatCurrency(payout.payoutAmount, payout.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">Dividend</p>
                      </div>
                    </div>
                  ))}

                  {(displayRetained ?? (displayNetProfit !== null ? Math.max(0, displayNetProfit - displayPayouts.reduce((s: number, p: any) => s + p.payoutAmount, 0)) : null)) !== null && (
                    <div className="flex items-center justify-between p-5 bg-amber-50/50 border-t-2 border-amber-200/50">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-sm shrink-0">R</div>
                        <div>
                          <p className="font-semibold text-foreground">Retained Earnings</p>
                          <p className="text-xs text-muted-foreground">Unallocated profit ({remainingPct.toFixed(2)}%)</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-xl font-display font-bold text-amber-600" data-testid="text-retained-row">
                          {formatCurrency(displayRetained ?? Math.max(0, displayNetProfit! - displayPayouts.reduce((s: number, p: any) => s + p.payoutAmount, 0)), currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">Retained</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
