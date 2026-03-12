import jsPDF from "jspdf";
import type { BrandingParam } from "./pdf-receipts";

// Brand colours — Forest Green
const PRIMARY_GREEN = [27, 67, 50] as const;
const PALE_MINT = [216, 243, 220] as const;

// ─── Utilities ───────────────────────────────────────────────────────────────

function fmt(amount: number, currency = "UGX"): string {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-UG", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(amount);
}

/**
 * Three-column header — identical design as pdf-receipts.ts
 * Left: Logo | Centre: School Name + Address | Right: Document title + date
 */
function addHeader(
  doc: jsPDF,
  documentTitle: string,
  documentSub: string,
  branding?: BrandingParam
): number {
  const schoolName = branding?.schoolName || "HelioPay System";
  const schoolAddress = branding?.schoolAddress || "";
  const logoUrl = branding?.logoUrl;
  const hasLogo = typeof logoUrl === "string" && logoUrl.startsWith("data:");
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const PAGE_W = 210;
  const MARGIN = 10;
  const LOGO_SIZE = 25;
  const LOGO_X = MARGIN;
  const LOGO_COL_W = hasLogo ? LOGO_SIZE + 6 : 0;
  const RIGHT_COL_W = 44;
  const RIGHT_X = PAGE_W - MARGIN - RIGHT_COL_W;
  const CENTER_X = MARGIN + LOGO_COL_W;
  const CENTER_W = RIGHT_X - CENTER_X - 4;

  const nameFontPt = schoolName.length > 30 ? Math.round(18 * 0.85) : 18;
  const nameFontMm = nameFontPt * 0.352778;
  const nameLines = doc.splitTextToSize(schoolName, CENTER_W);
  const addrLines = schoolAddress
    ? doc.splitTextToSize(schoolAddress, CENTER_W)
    : [];
  const centerBlockH =
    nameLines.length * nameFontMm +
    (addrLines.length ? addrLines.length * 4 + 3 : 0);
  const HEADER_H = Math.max(LOGO_SIZE + 10, centerBlockH + 16, 44);

  doc.setFillColor(...PRIMARY_GREEN);
  doc.rect(0, 0, PAGE_W, HEADER_H, "F");

  if (hasLogo) {
    const logoY = (HEADER_H - LOGO_SIZE) / 2;
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(LOGO_X - 1, logoY - 1, LOGO_SIZE + 2, LOGO_SIZE + 2, 2, 2, "F");
      doc.addImage(logoUrl as string, "PNG", LOGO_X, logoY, LOGO_SIZE, LOGO_SIZE);
    } catch {}
  }

  const centerCX = CENTER_X + CENTER_W / 2;
  let textY = (HEADER_H - centerBlockH) / 2 + nameFontMm;

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameFontPt);
  doc.text(nameLines, centerCX, textY, { align: "center" });
  textY += nameLines.length * nameFontMm + 2;

  if (addrLines.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(addrLines, centerCX, textY, { align: "center" });
  }

  const RIGHT_EDGE = PAGE_W - MARGIN;
  const rightMidY = HEADER_H / 2;
  const titleLines = doc.splitTextToSize(documentTitle, RIGHT_COL_W);
  const titleBlockH = titleLines.length * 4.5;
  const titleStartY = rightMidY - titleBlockH / 2 - (documentSub ? 3 : 0);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(titleLines, RIGHT_EDGE, titleStartY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 230, 215);
  doc.text(dateStr, RIGHT_EDGE, titleStartY + titleBlockH + 3, { align: "right" });

  if (documentSub) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(documentSub, RIGHT_EDGE, titleStartY + titleBlockH + 9, { align: "right" });
  }

  doc.setDrawColor(...PRIMARY_GREEN);
  doc.setLineWidth(0.8);
  doc.line(0, HEADER_H, PAGE_W, HEADER_H);

  doc.setTextColor(0, 0, 0);
  return HEADER_H + 10;
}

function addHeaderLandscape(
  doc: jsPDF,
  documentTitle: string,
  documentSub: string,
  branding?: BrandingParam
): number {
  const schoolName = branding?.schoolName || "HelioPay System";
  const schoolAddress = branding?.schoolAddress || "";
  const logoUrl = branding?.logoUrl;
  const hasLogo = typeof logoUrl === "string" && logoUrl.startsWith("data:");
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const PAGE_W = 297; // landscape A4
  const MARGIN = 10;
  const LOGO_SIZE = 22;
  const LOGO_COL_W = hasLogo ? LOGO_SIZE + 6 : 0;
  const RIGHT_COL_W = 50;
  const RIGHT_X = PAGE_W - MARGIN - RIGHT_COL_W;
  const CENTER_X = MARGIN + LOGO_COL_W;
  const CENTER_W = RIGHT_X - CENTER_X - 4;

  const nameFontPt = schoolName.length > 30 ? Math.round(18 * 0.85) : 18;
  const nameFontMm = nameFontPt * 0.352778;
  const nameLines = doc.splitTextToSize(schoolName, CENTER_W);
  const addrLines = schoolAddress ? doc.splitTextToSize(schoolAddress, CENTER_W) : [];
  const centerBlockH = nameLines.length * nameFontMm + (addrLines.length ? addrLines.length * 4 + 3 : 0);
  const HEADER_H = Math.max(LOGO_SIZE + 10, centerBlockH + 16, 40);

  doc.setFillColor(...PRIMARY_GREEN);
  doc.rect(0, 0, PAGE_W, HEADER_H, "F");

  if (hasLogo) {
    const logoY = (HEADER_H - LOGO_SIZE) / 2;
    try {
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(MARGIN - 1, logoY - 1, LOGO_SIZE + 2, LOGO_SIZE + 2, 2, 2, "F");
      doc.addImage(logoUrl as string, "PNG", MARGIN, logoY, LOGO_SIZE, LOGO_SIZE);
    } catch {}
  }

  const centerCX = CENTER_X + CENTER_W / 2;
  let textY = (HEADER_H - centerBlockH) / 2 + nameFontMm;
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(nameFontPt);
  doc.text(nameLines, centerCX, textY, { align: "center" });
  textY += nameLines.length * nameFontMm + 2;
  if (addrLines.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(addrLines, centerCX, textY, { align: "center" });
  }

  const RIGHT_EDGE = PAGE_W - MARGIN;
  const titleLines = doc.splitTextToSize(documentTitle, RIGHT_COL_W);
  const titleBlockH = titleLines.length * 4.5;
  const titleStartY = HEADER_H / 2 - titleBlockH / 2 - (documentSub ? 3 : 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(titleLines, RIGHT_EDGE, titleStartY, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 230, 215);
  doc.text(dateStr, RIGHT_EDGE, titleStartY + titleBlockH + 3, { align: "right" });
  if (documentSub) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(documentSub, RIGHT_EDGE, titleStartY + titleBlockH + 9, { align: "right" });
  }

  doc.setDrawColor(...PRIMARY_GREEN);
  doc.setLineWidth(0.8);
  doc.line(0, HEADER_H, PAGE_W, HEADER_H);
  doc.setTextColor(0, 0, 0);
  return HEADER_H + 10;
}

function divider(doc: jsPDF, y: number, x1 = 15, x2 = 195): number {
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(x1, y, x2, y);
  return y + 6;
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text(text, 18, y);
  return y + 2;
}

function tableHeader(
  doc: jsPDF,
  y: number,
  cols: Array<{ label: string; x: number; align?: "right" | "center" }>,
  pageW = 210
): number {
  doc.setFillColor(...PRIMARY_GREEN);
  doc.rect(15, y, pageW - 30, 9, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  cols.forEach((c) => {
    if (c.align === "right") doc.text(c.label, c.x, y + 6, { align: "right" });
    else doc.text(c.label, c.x, y + 6);
  });
  return y + 13;
}

function addFooter(doc: jsPDF, branding?: BrandingParam): void {
  const name = branding?.schoolName || "HelioPay System";
  const PH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text(
    `Generated by ${name} · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`,
    doc.internal.pageSize.getWidth() / 2,
    PH - 6,
    { align: "center" }
  );
}

// ─── Financial Summary Report ─────────────────────────────────────────────────

export interface FinancialSummary {
  totalIncome: { UGX: number; USD: number };
  totalExpenses: { UGX: number; USD: number };
  netBalance: { UGX: number; USD: number };
  expensesByCategory: { category: string; amount: number; currency: string }[];
  incomeByFeeType: { feeType: string; amount: number; currency: string }[];
  period: string;
  startDate: string;
  endDate: string;
}

export function generateFinancialReportPDF(
  data: FinancialSummary,
  branding?: BrandingParam
): void {
  const doc = new jsPDF();
  const periodLabel =
    data.period === "weekly" ? "Weekly" : data.period === "monthly" ? "Monthly" : "Termly";
  const start = new Date(data.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const end = new Date(data.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  let y = addHeader(doc, `${periodLabel} Financial Report`, `${start} – ${end}`, branding);

  // Summary cards
  const COL1 = 18, COL2 = 108;
  y = sectionTitle(doc, "Financial Overview", y);
  y = divider(doc, y + 4);

  const kv = (label: string, val: string, x: number, isRed = false) => {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(140, 140, 140);
    doc.text(label, x, y);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    if (isRed) { doc.setTextColor(200, 38, 38); } else { doc.setTextColor(...PRIMARY_GREEN); }
    doc.text(val, x, y + 6);
  };

  // Income
  kv("Total Income (UGX)", fmt(data.totalIncome.UGX, "UGX"), COL1);
  kv("Total Income (USD)", fmt(data.totalIncome.USD, "USD"), COL2);
  y += 16;

  // Expenses
  kv("Total Expenses (UGX)", fmt(data.totalExpenses.UGX, "UGX"), COL1, true);
  kv("Total Expenses (USD)", fmt(data.totalExpenses.USD, "USD"), COL2, true);
  y += 16;

  // Net balance
  const ugxPos = data.netBalance.UGX >= 0;
  const usdPos = data.netBalance.USD >= 0;
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(140, 140, 140);
  doc.text("Net Balance (UGX)", COL1, y);
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.setTextColor(ugxPos ? 27 : 200, ugxPos ? 67 : 38, ugxPos ? 50 : 38);
  doc.text(fmt(data.netBalance.UGX, "UGX"), COL1, y + 6);
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(140, 140, 140);
  doc.text("Net Balance (USD)", COL2, y);
  doc.setFontSize(11); doc.setFont("helvetica", "bold");
  doc.setTextColor(usdPos ? 27 : 200, usdPos ? 67 : 38, usdPos ? 50 : 38);
  doc.text(fmt(data.netBalance.USD, "USD"), COL2, y + 6);
  y += 22;

  if (data.incomeByFeeType.length > 0) {
    y = sectionTitle(doc, "Income by Fee Type", y);
    y = divider(doc, y + 4);
    y = tableHeader(doc, y, [
      { label: "Fee Type", x: 19 },
      { label: "Currency", x: 110 },
      { label: "Amount", x: 191, align: "right" },
    ]);
    data.incomeByFeeType.forEach((item, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      const even = i % 2 === 0;
      doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
      doc.rect(15, y - 4, 180, 8, "F");
      doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
      doc.text(item.feeType, 19, y + 1);
      doc.text(item.currency, 110, y + 1);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN);
      doc.text(fmt(item.amount, item.currency), 191, y + 1, { align: "right" });
      y += 8;
    });
    y += 6;
  }

  if (data.expensesByCategory.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Expenses by Category", y);
    y = divider(doc, y + 4);
    y = tableHeader(doc, y, [
      { label: "Category", x: 19 },
      { label: "Currency", x: 110 },
      { label: "Amount", x: 191, align: "right" },
    ]);
    data.expensesByCategory.forEach((item, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      const even = i % 2 === 0;
      doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
      doc.rect(15, y - 4, 180, 8, "F");
      doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
      doc.text(item.category, 19, y + 1);
      doc.text(item.currency, 110, y + 1);
      doc.setFont("helvetica", "bold"); doc.setTextColor(200, 38, 38);
      doc.text(fmt(item.amount, item.currency), 191, y + 1, { align: "right" });
      y += 8;
    });
  }

  addFooter(doc, branding);
  doc.save(`financial-report-${data.period}-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─── Master Payment Report ────────────────────────────────────────────────────

export interface MasterPaymentRow {
  studentName: string;
  studentAdmissionNumber: string;
  studentClassGrade: string;
  receiptNumber: string;
  feeType: string;
  amount: number;
  currency: string;
  paymentDate: string;
  term: string;
}

export function generateMasterPaymentPDF(
  payments: MasterPaymentRow[],
  filters: { term?: string; classGrade?: string },
  branding?: BrandingParam
): void {
  const doc = new jsPDF({ orientation: "landscape" });
  const PAGE_W = 297;
  const filterParts = [filters.term, filters.classGrade].filter(Boolean).join(" · ");
  let y = addHeaderLandscape(
    doc,
    "Master Payment Report",
    filterParts || `${payments.length} record(s)`,
    branding
  );

  const cols = [
    { label: "Student Name", x: 15 },
    { label: "Adm. No.", x: 70 },
    { label: "Class", x: 96 },
    { label: "Receipt #", x: 120 },
    { label: "Fee Type", x: 152 },
    { label: "Term", x: 186 },
    { label: "Date", x: 210 },
    { label: "Amount", x: 283, align: "right" as const },
  ];

  y = tableHeader(doc, y, cols, PAGE_W);

  const totals: Record<string, number> = {};

  payments.forEach((p, i) => {
    if (y > 185) { doc.addPage(); y = 20; }
    const even = i % 2 === 0;
    doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
    doc.rect(15, y - 4, PAGE_W - 30, 8, "F");
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
    doc.text((p.studentName || "").substring(0, 26), 15, y + 1);
    doc.text((p.studentAdmissionNumber || "").substring(0, 10), 70, y + 1);
    doc.text((p.studentClassGrade || "").substring(0, 10), 96, y + 1);
    doc.text((p.receiptNumber || "").substring(0, 12), 120, y + 1);
    doc.text((p.feeType || "").substring(0, 16), 152, y + 1);
    doc.text((p.term || "").substring(0, 8), 186, y + 1);
    const ds = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" }) : "";
    doc.text(ds, 210, y + 1);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN);
    doc.text(fmt(p.amount, p.currency), 283, y + 1, { align: "right" });
    totals[p.currency] = (totals[p.currency] || 0) + p.amount;
    y += 8;
  });

  y += 4;
  y = divider(doc, y, 15, PAGE_W - 15);
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN);
  doc.text("Grand Totals:", 15, y);
  y += 7;
  Object.entries(totals).forEach(([cur, amt]) => {
    doc.setFontSize(9);
    doc.text(`${cur}: ${fmt(amt, cur)}`, 25, y);
    y += 6;
  });

  addFooter(doc, branding);
  doc.save(`master-payment-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─── Payslip ──────────────────────────────────────────────────────────────────

export interface PayslipData {
  staffName: string;
  staffType: string;
  position?: string;
  subjects?: string[];
  month: string;
  baseSalary: number;
  accommodationAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  deductions: number;
  deductionNotes?: string;
  currency: string;
  status: string;
}

export function generatePayslipPDF(data: PayslipData, branding?: BrandingParam): void {
  const doc = new jsPDF();
  let y = addHeader(doc, "PAYSLIP", data.month, branding);

  y = sectionTitle(doc, "Employee Details", y);
  y = divider(doc, y + 4);

  const kv2 = (label: string, val: string) => {
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(130, 130, 130);
    doc.text(label, 20, y);
    doc.setFont("helvetica", "bold"); doc.setTextColor(30, 30, 30);
    doc.text(val, 95, y);
    y += 7;
  };

  kv2("Name:", data.staffName);
  kv2("Staff Type:", data.staffType === "teacher" ? "Teaching Staff" : "Non-Teaching Staff");
  if (data.position) kv2("Position:", data.position);
  if (data.subjects?.length) kv2("Subjects:", data.subjects.join(", "));
  kv2("Status:", data.status);
  y += 4;

  y = sectionTitle(doc, "Earnings", y);
  y = divider(doc, y + 4);

  const amtRow = (label: string, amount: number, isDeduction = false) => {
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
    doc.text(label, 22, y);
    doc.setFont("helvetica", "bold");
    if (isDeduction) { doc.setTextColor(200, 38, 38); } else { doc.setTextColor(...PRIMARY_GREEN); }
    doc.text(fmt(amount, data.currency), 192, y, { align: "right" });
    y += 7;
  };

  amtRow("Base Salary", data.baseSalary);
  if (data.accommodationAllowance > 0) amtRow("Accommodation Allowance", data.accommodationAllowance);
  if (data.transportAllowance > 0) amtRow("Transport Allowance", data.transportAllowance);
  if (data.otherAllowances > 0) amtRow("Other Allowances", data.otherAllowances);

  const gross = data.baseSalary + data.accommodationAllowance + data.transportAllowance + data.otherAllowances;
  y += 2;
  divider(doc, y, 18, 195);
  y += 6;
  doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(50, 50, 50);
  doc.text("Gross Pay:", 22, y);
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text(fmt(gross, data.currency), 192, y, { align: "right" });
  y += 10;

  if (data.deductions > 0) {
    y = sectionTitle(doc, "Deductions", y);
    y = divider(doc, y + 4);
    amtRow(data.deductionNotes || "Deductions", data.deductions, true);
    y += 4;
  }

  divider(doc, y, 18, 195);
  y += 8;
  const net = gross - data.deductions;
  doc.setFillColor(...PALE_MINT);
  doc.roundedRect(15, y, 180, 22, 4, 4, "F");
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 120, 90);
  doc.text("NET PAY", 105, y + 9, { align: "center" });
  doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN);
  doc.text(fmt(net, data.currency), 105, y + 18, { align: "center" });

  addFooter(doc, branding);
  doc.save(`payslip-${data.staffName.replace(/\s+/g, "-")}-${data.month}.pdf`);
}

// ─── Dividend Distribution Report ─────────────────────────────────────────────

export interface DividendReportData {
  netProfit: number;
  currency: string;
  term: string;
  academicYear: string;
  payouts: { shareholderName: string; sharePercentage: string; payoutAmount: number }[];
  totalAllocated: number;
  retainedEarnings: number;
}

export function generateDividendReportPDF(data: DividendReportData, branding?: BrandingParam): void {
  const doc = new jsPDF();
  let y = addHeader(
    doc,
    "Dividend Distribution",
    `${data.term} · ${data.academicYear}`,
    branding
  );

  // Net profit highlight
  doc.setFillColor(...PALE_MINT);
  doc.roundedRect(15, y, 180, 28, 4, 4, "F");
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 120, 90);
  doc.text("Net Profit  (Total Revenue − Total Expenses)", 105, y + 9, { align: "center" });
  doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN);
  doc.text(fmt(data.netProfit, data.currency), 105, y + 22, { align: "center" });
  y += 36;

  y = sectionTitle(doc, "Shareholder Payouts", y);
  y = divider(doc, y + 4);
  y = tableHeader(doc, y, [
    { label: "Shareholder", x: 19 },
    { label: "Share %", x: 120, align: "right" },
    { label: "Dividend Amount", x: 191, align: "right" },
  ]);

  data.payouts.forEach((payout, i) => {
    if (y > 255) { doc.addPage(); y = 20; }
    const even = i % 2 === 0;
    doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
    doc.rect(15, y - 4, 180, 9, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
    doc.text(payout.shareholderName, 19, y + 2);
    doc.text(`${parseFloat(payout.sharePercentage).toFixed(2)}%`, 120, y + 2, { align: "right" });
    doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN);
    doc.text(fmt(payout.payoutAmount, data.currency), 191, y + 2, { align: "right" });
    y += 9;
  });

  y += 4;
  y = divider(doc, y);

  doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(40, 40, 40);
  doc.text("Total Allocated:", 19, y);
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text(fmt(data.totalAllocated, data.currency), 191, y, { align: "right" });
  y += 8;

  if (data.retainedEarnings > 0) {
    doc.setFillColor(255, 249, 231);
    doc.roundedRect(15, y, 180, 16, 3, 3, "F");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 80, 0);
    doc.text("Retained Earnings (Unallocated):", 19, y + 11);
    doc.setFont("helvetica", "bold"); doc.setFontSize(11);
    doc.text(fmt(data.retainedEarnings, data.currency), 191, y + 11, { align: "right" });
    y += 24;
  }

  addFooter(doc, branding);
  doc.save(
    `dividend-report-${data.term.replace(/\s/g, "-")}-${data.academicYear.replace("/", "-")}-${new Date().toISOString().split("T")[0]}.pdf`
  );
}

// ─── Detailed Expense Report ──────────────────────────────────────────────────

export interface DetailedExpenseRow {
  expenseDate: string | null;
  category: string;
  description: string;
  recordedBy: string;
  amount: number;
  currency: string;
  term?: string;
}

export function generateDetailedExpenseReportPDF(
  expenses: DetailedExpenseRow[],
  filters: { term?: string; currency?: string },
  branding?: BrandingParam
): void {
  const doc = new jsPDF();
  const filterLabel = [filters.term, filters.currency].filter(Boolean).join(" · ");
  let y = addHeader(
    doc,
    "Expense Report",
    filterLabel || `${expenses.length} transaction(s)`,
    branding
  );

  y = tableHeader(doc, y, [
    { label: "Date", x: 19 },
    { label: "Category", x: 48 },
    { label: "Description", x: 88 },
    { label: "Recorded By", x: 148 },
    { label: "Amount", x: 191, align: "right" },
  ]);

  const catTotals: Record<string, number> = {};

  expenses.forEach((exp, i) => {
    if (y > 262) { doc.addPage(); y = 20; }
    const even = i % 2 === 0;
    doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
    doc.rect(15, y - 3, 180, 8, "F");

    const ds = exp.expenseDate
      ? new Date(exp.expenseDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
      : "N/A";

    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
    doc.text(ds, 19, y + 2);
    doc.text(exp.category.substring(0, 14), 48, y + 2);
    doc.text(exp.description.substring(0, 30), 88, y + 2);
    doc.text((exp.recordedBy || "—").substring(0, 16), 148, y + 2);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN);
    doc.text(fmt(exp.amount, exp.currency), 191, y + 2, { align: "right" });
    y += 8;

    const key = `${exp.category} (${exp.currency})`;
    catTotals[key] = (catTotals[key] || 0) + exp.amount;
  });

  y += 4;
  if (y > 220) { doc.addPage(); y = 20; }
  y = sectionTitle(doc, "Total Expenditure by Category", y);
  y = divider(doc, y + 4);
  y = tableHeader(doc, y, [
    { label: "Category", x: 19 },
    { label: "Total Amount", x: 191, align: "right" },
  ]);

  let grandUGX = 0, grandUSD = 0;
  Object.entries(catTotals).sort(([a], [b]) => a.localeCompare(b)).forEach(([key, total], i) => {
    const even = i % 2 === 0;
    doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
    doc.rect(15, y - 3, 180, 8, "F");
    const cur = key.includes("USD") ? "USD" : "UGX";
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
    doc.text(key, 19, y + 2);
    doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN);
    doc.text(fmt(total, cur), 191, y + 2, { align: "right" });
    if (cur === "UGX") grandUGX += total; else grandUSD += total;
    y += 8;
  });

  y += 4;
  y = divider(doc, y);
  doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN);
  doc.text("Grand Total:", 19, y);
  const totalsText = [
    grandUGX > 0 ? `UGX: ${fmt(grandUGX, "UGX")}` : null,
    grandUSD > 0 ? `USD: ${fmt(grandUSD, "USD")}` : null,
  ].filter(Boolean).join("   ");
  doc.text(totalsText, 191, y, { align: "right" });

  addFooter(doc, branding);
  doc.save(`detailed-expense-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─── Detailed Budget Report ───────────────────────────────────────────────────

export interface BudgetComparisonRow {
  category: string;
  estimated: number;
  actual: number;
  variance: number;
  status: string;
  currency: string;
}

export function generateDetailedBudgetReportPDF(
  comparison: BudgetComparisonRow[],
  meta: { term: string; academicYear: string },
  branding?: BrandingParam
): void {
  const doc = new jsPDF();
  let y = addHeader(
    doc,
    "Budget vs Actual",
    `${meta.term} · ${meta.academicYear}`,
    branding
  );

  y = tableHeader(doc, y, [
    { label: "Category", x: 19 },
    { label: "Currency", x: 72 },
    { label: "Estimated", x: 108, align: "right" },
    { label: "Actual", x: 140, align: "right" },
    { label: "Variance", x: 170, align: "right" },
    { label: "Utilization", x: 191, align: "right" },
  ]);

  let overCount = 0, underCount = 0;
  const currTotals: Record<string, { est: number; act: number }> = {};

  comparison.forEach((row, i) => {
    if (y > 260) { doc.addPage(); y = 20; }
    const util = row.estimated > 0 ? Math.round((row.actual / row.estimated) * 100) : 0;
    const isOver = row.status === "Over Budget";
    if (isOver) overCount++; else underCount++;

    const even = i % 2 === 0;
    doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
    doc.rect(15, y - 3, 180, 8, "F");

    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
    doc.text(row.category.substring(0, 20), 19, y + 2);
    doc.text(row.currency, 72, y + 2);
    doc.text(fmt(row.estimated, row.currency), 108, y + 2, { align: "right" });
    doc.text(fmt(row.actual, row.currency), 140, y + 2, { align: "right" });

    // Variance: positive = under budget (good), negative = over
    const saved = row.estimated - row.actual;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(saved >= 0 ? 27 : 200, saved >= 0 ? 67 : 38, saved >= 0 ? 50 : 38);
    doc.text(`${saved >= 0 ? "+" : ""}${fmt(Math.abs(row.variance), row.currency)}`, 170, y + 2, { align: "right" });

    // Utilization %
    const utilR = util > 100 ? 200 : util > 85 ? 180 : 27;
    const utilG = util > 100 ? 38 : util > 85 ? 100 : 67;
    const utilB = util > 100 ? 38 : util > 85 ? 0 : 50;
    doc.setTextColor(utilR, utilG, utilB);
    doc.text(`${util}%`, 191, y + 2, { align: "right" });
    y += 8;

    if (!currTotals[row.currency]) currTotals[row.currency] = { est: 0, act: 0 };
    currTotals[row.currency].est += row.estimated;
    currTotals[row.currency].act += row.actual;
  });

  y += 6;
  if (y > 230) { doc.addPage(); y = 20; }
  y = sectionTitle(doc, "Budget Summary by Currency", y);
  y = divider(doc, y + 4);

  Object.entries(currTotals).forEach(([cur, { est, act }]) => {
    const overallUtil = est > 0 ? Math.round((act / est) * 100) : 0;
    doc.setFillColor(...PALE_MINT);
    doc.roundedRect(15, y, 180, 18, 3, 3, "F");
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 80, 70);
    doc.text(cur, 22, y + 12);
    doc.setFont("helvetica", "bold");
    doc.text(`Budget: ${fmt(est, cur)}`, 45, y + 12);
    doc.text(`Actual: ${fmt(act, cur)}`, 115, y + 12);
    const uR = overallUtil > 100 ? 200 : 27, uG = overallUtil > 100 ? 38 : 67, uB = overallUtil > 100 ? 38 : 50;
    doc.setTextColor(uR, uG, uB);
    doc.text(`${overallUtil}% utilized`, 191, y + 12, { align: "right" });
    y += 24;
  });

  y += 2;
  doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120);
  doc.text(
    `Categories under budget: ${underCount}   ·   Categories over budget: ${overCount}`,
    105,
    y,
    { align: "center" }
  );

  addFooter(doc, branding);
  doc.save(
    `budget-report-${meta.term.replace(/\s/g, "-")}-${meta.academicYear.replace("/", "-")}-${new Date().toISOString().split("T")[0]}.pdf`
  );
}

export interface SSCSEPaymentRow {
  studentName: string;
  studentAdmissionNumber: string;
  studentClassGrade: string;
  receiptNumber: string;
  paymentDate: string;
  amount: number;
  term: string;
  recordedBy?: string | null;
}

export function generateSSCSECollectionReportPDF(
  payments: SSCSEPaymentRow[],
  branding?: BrandingParam
): void {
  const doc = new jsPDF();
  let y = addHeader(doc, "SSCSE Fee Collection Report", "Senior 4 Examination Fees — USD Collections", branding);

  y = tableHeader(doc, y, [
    { label: "#", x: 19 },
    { label: "Student Name", x: 28 },
    { label: "Adm No.", x: 90 },
    { label: "Receipt No.", x: 120 },
    { label: "Term", x: 158 },
    { label: "Date", x: 174, align: "right" },
    { label: "Amount (USD)", x: 195, align: "right" },
  ]);

  let totalUSD = 0;

  payments.forEach((row, i) => {
    if (y > 260) { doc.addPage(); y = 20; }
    const even = i % 2 === 0;
    doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
    doc.rect(15, y - 3, 180, 8, "F");

    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
    doc.text(String(i + 1), 19, y + 2);
    doc.text(row.studentName.substring(0, 25), 28, y + 2);
    doc.text((row.studentAdmissionNumber || "").substring(0, 12), 90, y + 2);
    doc.text((row.receiptNumber || "").substring(0, 16), 120, y + 2);
    doc.text(row.term || "N/A", 158, y + 2);
    const dateStr = row.paymentDate ? new Date(row.paymentDate).toLocaleDateString("en-GB") : "N/A";
    doc.text(dateStr, 174, y + 2, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(fmt(row.amount, "USD"), 195, y + 2, { align: "right" });
    totalUSD += row.amount;
    y += 8;
  });

  // Total footer
  y += 4;
  doc.setFillColor(...PRIMARY_GREEN);
  doc.rect(15, y, 180, 12, "F");
  doc.setFontSize(9.5); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("TOTAL SSCSE COLLECTED", 19, y + 8);
  doc.text(fmt(totalUSD, "USD"), 195, y + 8, { align: "right" });
  y += 18;

  // Info note
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFillColor(...PALE_MINT);
  doc.roundedRect(15, y, 180, 18, 3, 3, "F");
  doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 80, 70);
  doc.text(
    "Note: SSCSE fees are collected in USD as pass-through funds for examination bodies and are",
    22, y + 7
  );
  doc.text("excluded from net school profit calculations.", 22, y + 14);

  addFooter(doc, branding);
  doc.save(`sscse-collection-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Master Transaction Log PDF (for Reports Dashboard)
// ─────────────────────────────────────────────────────────────────────────────
export interface TransactionLogRow {
  studentName: string;
  studentClassGrade: string;
  paymentDate: string;
  feeType: string;
  amount: number;
  currency: string;
  term: string;
  recordedBy?: string | null;
  receiptNumber: string;
}

export function generateMasterTransactionLogPDF(
  rows: TransactionLogRow[],
  branding?: BrandingParam
): void {
  const doc = new jsPDF({ orientation: "landscape" });
  const PAGE_W = 297;

  let y = addHeaderLandscape(
    doc,
    "Master Transaction Log",
    `All Payments · ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long" })}`,
    branding
  );

  // Group rows by fee type
  const groups: Record<string, TransactionLogRow[]> = {};
  rows.forEach(r => {
    const key = r.feeType || "Uncategorized";
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });

  const grandTotals: Record<string, number> = {};

  for (const [feeType, items] of Object.entries(groups)) {
    // Section heading
    if (y > 170) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, feeType, y);
    y = divider(doc, y + 4);

    // Table header
    const cols = [
      { label: "Date", x: 15 },
      { label: "Student Name", x: 42 },
      { label: "Class", x: 105 },
      { label: "Term", x: 133 },
      { label: "Recorded By", x: 158 },
      { label: "Receipt #", x: 210 },
      { label: "Amount", x: PAGE_W - 15, align: "right" as const },
    ];
    y = tableHeader(doc, y, cols, PAGE_W);

    let subtotal = 0;
    const currency = items[0]?.currency || "UGX";

    items.forEach((r, i) => {
      if (y > 185) { doc.addPage(); y = 20; }
      const even = i % 2 === 0;
      doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
      doc.rect(15, y - 4, PAGE_W - 30, 8, "F");

      doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
      const dateStr = r.paymentDate ? new Date(r.paymentDate).toLocaleDateString("en-GB") : "N/A";
      doc.text(dateStr, 15, y + 1);
      doc.text((r.studentName || "").substring(0, 28), 42, y + 1);
      doc.text((r.studentClassGrade || "").substring(0, 12), 105, y + 1);
      doc.text(r.term || "N/A", 133, y + 1);
      const recordedBy = (r.recordedBy || "N/A").substring(0, 20);
      doc.text(recordedBy, 158, y + 1);
      doc.text((r.receiptNumber || "").substring(0, 18), 210, y + 1);
      doc.setFont("helvetica", "bold");
      doc.text(fmt(r.amount, r.currency), PAGE_W - 15, y + 1, { align: "right" });

      subtotal += r.amount;
      grandTotals[currency] = (grandTotals[currency] || 0) + r.amount;
      y += 8;
    });

    // Subtotal row
    y += 2;
    doc.setFillColor(...PALE_MINT);
    doc.rect(15, y, PAGE_W - 30, 10, "F");
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN as [number, number, number]);
    doc.text(`${feeType} Subtotal`, 18, y + 7);
    doc.text(fmt(subtotal, currency), PAGE_W - 15, y + 7, { align: "right" });
    y += 16;
  }

  // Grand total footer
  if (y > 170) { doc.addPage(); y = 20; }
  y += 4;
  doc.setFillColor(...PRIMARY_GREEN as [number, number, number]);
  doc.rect(15, y, PAGE_W - 30, 14, "F");
  doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
  doc.text("GRAND TOTAL", 20, y + 10);

  let xOffset = PAGE_W - 15;
  const currencies = Object.keys(grandTotals).sort();
  currencies.reverse().forEach(cur => {
    doc.text(`${cur} ${fmt(grandTotals[cur], cur)}`, xOffset, y + 10, { align: "right" });
    xOffset -= 60;
  });

  y += 20;
  if (grandTotals["USD"] && grandTotals["UGX"]) {
    if (y > 180) { doc.addPage(); y = 20; }
    doc.setFillColor(...PALE_MINT as [number, number, number]);
    doc.roundedRect(15, y, PAGE_W - 30, 14, 3, 3, "F");
    doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 80, 70);
    doc.text("Note: SSCSE fees (USD) are pass-through exam body funds and are excluded from net school profit.", 20, y + 9);
  }

  addFooter(doc, branding);
  doc.save(`master-transaction-log-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Teaching Staff Report PDF
// ─────────────────────────────────────────────────────────────────────────────
export interface TeacherReportRow {
  fullName: string;
  subjects: string[];
  phoneNumber: string;
  email?: string | null;
  baseSalary: number;
  accommodationAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  deductions: number;
  currency: string;
  status: string;
}

export function generateTeachingStaffPDF(
  teachers: TeacherReportRow[],
  branding?: BrandingParam
): void {
  const doc = new jsPDF({ orientation: "landscape" });
  const PAGE_W = 297;

  let y = addHeaderLandscape(doc, "Teaching Staff Report", `${teachers.length} Staff Member(s)`, branding);

  const cols = [
    { label: "#", x: 15 },
    { label: "Full Name", x: 23 },
    { label: "Subjects", x: 80 },
    { label: "Phone", x: 148 },
    { label: "Email", x: 182 },
    { label: "Net Salary", x: PAGE_W - 30, align: "right" as const },
    { label: "Status", x: PAGE_W - 15, align: "right" as const },
  ];

  y = tableHeader(doc, y, cols, PAGE_W);

  teachers.forEach((t, i) => {
    if (y > 185) { doc.addPage(); y = 20; }
    const even = i % 2 === 0;
    doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
    doc.rect(15, y - 4, PAGE_W - 30, 9, "F");

    const net = t.baseSalary + t.accommodationAllowance + t.transportAllowance + t.otherAllowances - t.deductions;
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
    doc.text(String(i + 1), 15, y + 2);
    doc.text(t.fullName.substring(0, 24), 23, y + 2);
    doc.text((t.subjects || []).join(", ").substring(0, 30), 80, y + 2);
    doc.text(t.phoneNumber || "N/A", 148, y + 2);
    doc.text((t.email || "N/A").substring(0, 24), 182, y + 2);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_GREEN as [number, number, number]);
    doc.text(fmt(net, t.currency), PAGE_W - 30, y + 2, { align: "right" });

    const statusColor: [number, number, number] = t.status === "Active" ? [22, 101, 52] : [100, 100, 100];
    doc.setTextColor(...statusColor);
    doc.setFont("helvetica", "normal");
    doc.text(t.status, PAGE_W - 15, y + 2, { align: "right" });

    y += 9;
  });

  // Totals by currency
  const totals: Record<string, number> = {};
  teachers.filter(t => t.status === "Active").forEach(t => {
    const net = t.baseSalary + t.accommodationAllowance + t.transportAllowance + t.otherAllowances - t.deductions;
    totals[t.currency] = (totals[t.currency] || 0) + net;
  });

  y += 6;
  if (y > 175) { doc.addPage(); y = 20; }
  y = sectionTitle(doc, "Total Monthly Payroll (Active Staff)", y);
  y = divider(doc, y + 4);

  Object.entries(totals).forEach(([cur, total]) => {
    doc.setFillColor(...PALE_MINT as [number, number, number]);
    doc.roundedRect(15, y, PAGE_W - 30, 12, 3, 3, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN as [number, number, number]);
    doc.text(`${cur} Total:`, 22, y + 8);
    doc.text(fmt(total, cur), PAGE_W - 15, y + 8, { align: "right" });
    y += 18;
  });

  addFooter(doc, branding);
  doc.save(`teaching-staff-report-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Non-Teaching Staff Report PDF
// ─────────────────────────────────────────────────────────────────────────────
export interface NonTeachingStaffReportRow {
  fullName: string;
  position: string;
  phoneNumber: string;
  email?: string | null;
  baseSalary: number;
  currency: string;
  contractType: string;
  status: string;
}

export function generateNonTeachingStaffPDF(
  staff: NonTeachingStaffReportRow[],
  branding?: BrandingParam
): void {
  const doc = new jsPDF({ orientation: "landscape" });
  const PAGE_W = 297;

  let y = addHeaderLandscape(doc, "Non-Teaching Staff Report", `${staff.length} Staff Member(s)`, branding);

  const cols = [
    { label: "#", x: 15 },
    { label: "Full Name", x: 23 },
    { label: "Position", x: 80 },
    { label: "Contract", x: 140 },
    { label: "Phone", x: 170 },
    { label: "Email", x: 200 },
    { label: "Salary", x: PAGE_W - 15, align: "right" as const },
  ];

  y = tableHeader(doc, y, cols, PAGE_W);

  staff.forEach((s, i) => {
    if (y > 185) { doc.addPage(); y = 20; }
    const even = i % 2 === 0;
    doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
    doc.rect(15, y - 4, PAGE_W - 30, 9, "F");

    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
    doc.text(String(i + 1), 15, y + 2);
    doc.text(s.fullName.substring(0, 24), 23, y + 2);
    doc.text((s.position || "N/A").substring(0, 24), 80, y + 2);
    doc.text(s.contractType || "N/A", 140, y + 2);
    doc.text(s.phoneNumber || "N/A", 170, y + 2);
    doc.text((s.email || "N/A").substring(0, 20), 200, y + 2);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_GREEN as [number, number, number]);
    doc.text(fmt(s.baseSalary, s.currency), PAGE_W - 15, y + 2, { align: "right" });
    y += 9;
  });

  // Totals
  const totals: Record<string, number> = {};
  staff.filter(s => s.status === "Active").forEach(s => {
    totals[s.currency] = (totals[s.currency] || 0) + s.baseSalary;
  });

  y += 6;
  if (y > 175) { doc.addPage(); y = 20; }
  y = sectionTitle(doc, "Total Monthly Payroll (Active Staff)", y);
  y = divider(doc, y + 4);

  Object.entries(totals).forEach(([cur, total]) => {
    doc.setFillColor(...PALE_MINT as [number, number, number]);
    doc.roundedRect(15, y, PAGE_W - 30, 12, 3, 3, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY_GREEN as [number, number, number]);
    doc.text(`${cur} Total:`, 22, y + 8);
    doc.text(fmt(total, cur), PAGE_W - 15, y + 8, { align: "right" });
    y += 18;
  });

  addFooter(doc, branding);
  doc.save(`non-teaching-staff-report-${new Date().toISOString().split("T")[0]}.pdf`);
}
