import jsPDF from "jspdf";
import QRCode from "qrcode";
import type { BrandingSettings } from "@shared/schema";

// Brand colours — Forest Green
const PRIMARY_GREEN = [27, 67, 50] as const;

export type BrandingParam =
  | Pick<BrandingSettings, "schoolName" | "schoolAddress" | "logoUrl">
  | null
  | undefined;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrencyPlain(amount: number, currency = "UGX"): string {
  return new Intl.NumberFormat(currency === "USD" ? "en-US" : "en-UG", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(amount);
}

/**
 * Three-column header
 * ┌──────────┬──────────────────────────┬──────────────────┐
 * │  LOGO    │   SCHOOL NAME            │  Document Title  │
 * │          │   Address / Contact      │  Date            │
 * └──────────┴──────────────────────────┴──────────────────┘
 *
 * @returns y position directly below the header (ready for body content)
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

  // ── Layout constants ──────────────────────────────────────────────────────
  const PAGE_W = 210;
  const MARGIN = 10;
  const LOGO_SIZE = 25; // mm × mm
  const LOGO_X = MARGIN;
  const LOGO_COL_W = hasLogo ? LOGO_SIZE + 6 : 0; // 0 when no logo

  const RIGHT_COL_W = 42;
  const RIGHT_X = PAGE_W - MARGIN - RIGHT_COL_W;
  const CENTER_X = MARGIN + LOGO_COL_W;
  const CENTER_W = RIGHT_X - CENTER_X - 4;

  // Dynamic font sizing for long school names (reduce 15 % if > 30 chars)
  const nameFontPt = schoolName.length > 30 ? Math.round(18 * 0.85) : 18;
  const nameFontMm = nameFontPt * 0.352778; // pt → mm line height approx

  // Compute text block height for centre column to derive header height
  const nameLines = doc.splitTextToSize(schoolName, CENTER_W);
  const addrLines = schoolAddress
    ? doc.splitTextToSize(schoolAddress, CENTER_W)
    : [];
  const centerBlockH =
    nameLines.length * nameFontMm + (addrLines.length ? addrLines.length * 4 + 3 : 0);
  const HEADER_H = Math.max(LOGO_SIZE + 10, centerBlockH + 16, 44);

  // ── Green background ──────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY_GREEN);
  doc.rect(0, 0, PAGE_W, HEADER_H, "F");

  // ── Left column: Logo ─────────────────────────────────────────────────────
  if (hasLogo) {
    const logoY = (HEADER_H - LOGO_SIZE) / 2;
    try {
      // White background box (quiet zone) behind logo
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(LOGO_X - 1, logoY - 1, LOGO_SIZE + 2, LOGO_SIZE + 2, 2, 2, "F");
      doc.addImage(logoUrl as string, "PNG", LOGO_X, logoY, LOGO_SIZE, LOGO_SIZE);
    } catch {
      // Logo failed to render — fall through gracefully
    }
  }

  // ── Centre column: School name + address ──────────────────────────────────
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

  // ── Right column: Document title + date ───────────────────────────────────
  const RIGHT_EDGE = PAGE_W - MARGIN;
  const rightMidY = HEADER_H / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  // Stack title lines if needed
  const titleLines = doc.splitTextToSize(documentTitle, RIGHT_COL_W);
  const titleBlockH = titleLines.length * 4.5;
  const titleStartY = rightMidY - titleBlockH / 2 - (documentSub ? 3 : 0);
  doc.text(titleLines, RIGHT_EDGE, titleStartY, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 230, 215); // slightly muted white-green
  doc.text(dateStr, RIGHT_EDGE, titleStartY + titleBlockH + 3, { align: "right" });

  if (documentSub) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(200, 230, 215);
    doc.text(documentSub, RIGHT_EDGE, titleStartY + titleBlockH + 9, { align: "right" });
  }

  // ── Separator line below header ───────────────────────────────────────────
  doc.setDrawColor(...PRIMARY_GREEN);
  doc.setLineWidth(0.8);
  doc.line(0, HEADER_H, PAGE_W, HEADER_H);

  doc.setTextColor(0, 0, 0);
  return HEADER_H + 10;
}

function addDivider(doc: jsPDF, y: number): number {
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(15, y, 195, y);
  return y + 6;
}

function labelValue(
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  x = 18
): number {
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text(label, x, y);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  const wrapped = doc.splitTextToSize(value, 78);
  doc.text(wrapped, x, y + 5);
  return y + 5 + wrapped.length * 5 + 3;
}

function addFooter(doc: jsPDF, branding?: BrandingParam): void {
  const schoolName = branding?.schoolName || "HelioPay System";
  const PH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 180, 180);
  doc.text(
    `Generated by ${schoolName} · ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`,
    105,
    PH - 6,
    { align: "center" }
  );
}

// ─── QR + Signature at bottom ────────────────────────────────────────────────

async function addQRAndSignature(
  doc: jsPDF,
  receiptNumber: string
): Promise<void> {
  const PH = doc.internal.pageSize.getHeight();
  const PW = doc.internal.pageSize.getWidth();

  // QR code — bottom-right with white quiet zone
  const QR_SIZE = 28;
  const QZ = 3; // quiet zone (white border), mm
  const QR_X = PW - QR_SIZE - QZ - 12;
  const QR_Y = PH - QR_SIZE - QZ - 20;

  try {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const verifyUrl = `${baseUrl}/verify/receipt/${encodeURIComponent(receiptNumber)}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
      width: 140,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    // White quiet zone box
    doc.setFillColor(255, 255, 255);
    doc.rect(QR_X - QZ, QR_Y - QZ, QR_SIZE + QZ * 2, QR_SIZE + QZ * 2, "F");
    doc.addImage(qrDataUrl, "PNG", QR_X, QR_Y, QR_SIZE, QR_SIZE);

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(130, 130, 130);
    doc.text("Scan to verify receipt", QR_X + QR_SIZE / 2, QR_Y + QR_SIZE + QZ + 4, {
      align: "center",
    });
  } catch {
    // QR generation failed silently
  }

  // Bursar signature line — bottom-left, same vertical level as QR
  const SIG_Y = PH - 24;
  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.3);
  doc.line(15, SIG_Y, 80, SIG_Y);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text("Bursar / Authorized Signature", 47, SIG_Y + 5, { align: "center" });
}

// ─── Payment Receipt ──────────────────────────────────────────────────────────

export async function generatePaymentReceiptPDF(
  payment: any,
  student: any,
  branding?: BrandingParam
): Promise<void> {
  const doc = new jsPDF();
  let y = addHeader(
    doc,
    "Official Receipt",
    `No: ${payment.receiptNumber || "N/A"}`,
    branding
  );

  // ── Student block ─────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text("Student Information", 18, y);
  y += 6;
  y = addDivider(doc, y);

  const COL1 = 18;
  const COL2 = 105;

  // Row 1
  const rowA1end = labelValue(doc, "Student Name", student?.fullName || "N/A", y, COL1);
  labelValue(doc, "Admission No.", student?.admissionNumber || "N/A", y, COL2);
  y = rowA1end;

  const rowA2end = labelValue(doc, "Class / Grade", student?.classGrade || "N/A", y, COL1);
  labelValue(doc, "Academic Year", student?.academicYear || "N/A", y, COL2);
  y = rowA2end;

  y += 2;

  // ── Payment block ─────────────────────────────────────────────────────────
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text("Payment Details", 18, y);
  y += 6;
  y = addDivider(doc, y);

  const paymentDate = payment.paymentDate
    ? new Date(payment.paymentDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const rowB1end = labelValue(doc, "Payment Date", paymentDate, y, COL1);
  labelValue(doc, "Term", payment.term || "N/A", y, COL2);
  y = rowB1end;

  const rowB2end = labelValue(doc, "Fee Type", payment.feeType || "N/A", y, COL1);
  labelValue(doc, "Recorded By", payment.recordedBy || "N/A", y, COL2);
  y = rowB2end;

  if (payment.notes) {
    y = labelValue(doc, "Notes", payment.notes, y, COL1);
  }

  // Fee breakdown
  if (payment.feeBreakdown) {
    try {
      const bd =
        typeof payment.feeBreakdown === "string"
          ? JSON.parse(payment.feeBreakdown)
          : payment.feeBreakdown;
      if (Array.isArray(bd) && bd.length > 1) {
        y += 2;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(80, 80, 80);
        doc.text("Fee Breakdown:", 20, y);
        y += 5;
        bd.forEach((item: { feeType: string; amount: number }) => {
          if (y > 210) { doc.addPage(); y = 20; }
          doc.setFont("helvetica", "normal");
          doc.setTextColor(80, 80, 80);
          doc.text(`• ${item.feeType}`, 26, y);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(...PRIMARY_GREEN);
          doc.text(
            formatCurrencyPlain(item.amount, payment.currency),
            192,
            y,
            { align: "right" }
          );
          y += 6;
        });
        doc.setTextColor(0, 0, 0);
        y += 2;
      }
    } catch {}
  }

  y += 4;
  y = addDivider(doc, y);

  // ── Amount box ───────────────────────────────────────────────────────────
  doc.setFillColor(216, 243, 220);
  doc.roundedRect(15, y, 180, 30, 4, 4, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 120, 90);
  doc.text("AMOUNT RECEIVED", 105, y + 10, { align: "center" });
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text(
    formatCurrencyPlain(payment.amount, payment.currency),
    105,
    y + 23,
    { align: "center" }
  );
  y += 38;

  // ── QR + Signature at bottom ─────────────────────────────────────────────
  await addQRAndSignature(doc, payment.receiptNumber || String(payment.id));
  addFooter(doc, branding);

  doc.save(`receipt-${payment.receiptNumber || payment.id}.pdf`);
}

// ─── Expense Voucher ──────────────────────────────────────────────────────────

export function generateExpenseReceiptPDF(expense: any, branding?: BrandingParam): void {
  const doc = new jsPDF();
  let y = addHeader(
    doc,
    "Expense Voucher",
    `No: EXP-${String(expense.id).padStart(5, "0")}`,
    branding
  );

  const COL1 = 18;
  const COL2 = 105;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text("Expense Details", COL1, y);
  y += 6;
  y = addDivider(doc, y);

  const expenseDate = expense.expenseDate
    ? new Date(expense.expenseDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const r1end = labelValue(doc, "Date", expenseDate, y, COL1);
  labelValue(doc, "Category", expense.category || "N/A", y, COL2);
  y = r1end;

  const r2end = labelValue(doc, "Recorded By", expense.recordedBy || "N/A", y, COL1);
  labelValue(doc, "Term", expense.term || "N/A", y, COL2);
  y = r2end;

  y += 4;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text("Description", COL1, y);
  y += 6;
  y = addDivider(doc, y);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const descLines = doc.splitTextToSize(expense.description || "N/A", 175);
  doc.text(descLines, COL1, y);
  y += descLines.length * 6 + 8;

  y = addDivider(doc, y);

  doc.setFillColor(254, 226, 226);
  doc.roundedRect(15, y, 180, 30, 4, 4, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 50, 50);
  doc.text("AMOUNT SPENT", 105, y + 10, { align: "center" });
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 38, 38);
  doc.text(
    formatCurrencyPlain(expense.amount, expense.currency),
    105,
    y + 23,
    { align: "center" }
  );
  y += 38;

  // Signature line
  const PH = doc.internal.pageSize.getHeight();
  const SIG_Y = PH - 28;
  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.3);
  doc.line(15, SIG_Y, 90, SIG_Y);
  doc.line(120, SIG_Y, 195, SIG_Y);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text("Bursar / Authorized Signature", 52, SIG_Y + 5, { align: "center" });
  doc.text("Date / Stamp", 157, SIG_Y + 5, { align: "center" });

  addFooter(doc, branding);
  doc.save(`expense-voucher-EXP-${String(expense.id).padStart(5, "0")}.pdf`);
}

// ─── Payroll Receipt ──────────────────────────────────────────────────────────

export function generatePayrollReceiptPDF(
  payroll: any,
  items: any[],
  branding?: BrandingParam
): void {
  const doc = new jsPDF();
  let y = addHeader(
    doc,
    "Payroll Summary",
    `PAY-${String(payroll.id).padStart(5, "0")} · ${payroll.month || ""}`,
    branding
  );

  const COL1 = 18;
  const COL2 = 105;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text("Payroll Information", COL1, y);
  y += 6;
  y = addDivider(doc, y);

  const r1end = labelValue(doc, "Month", payroll.month || "N/A", y, COL1);
  labelValue(doc, "Status", payroll.status || "N/A", y, COL2);
  y = r1end;

  const createdDate = payroll.createdAt
    ? new Date(payroll.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  const r2end = labelValue(doc, "Created By", payroll.createdBy || "N/A", y, COL1);
  labelValue(doc, "Created Date", createdDate, y, COL2);
  y = r2end;

  if (payroll.approvedBy) {
    const approvedDate = payroll.approvedAt
      ? new Date(payroll.approvedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";
    const r3end = labelValue(doc, "Approved By", payroll.approvedBy, y, COL1);
    labelValue(doc, "Approved Date", approvedDate, y, COL2);
    y = r3end;
  }

  y += 4;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text("Staff Salary Breakdown", COL1, y);
  y += 6;
  y = addDivider(doc, y);

  // Table header row
  doc.setFillColor(...PRIMARY_GREEN);
  doc.rect(15, y, 180, 9, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("#", 19, y + 6);
  doc.text("Full Name", 28, y + 6);
  doc.text("Type", 120, y + 6);
  doc.text("Net Pay", 191, y + 6, { align: "right" });
  y += 13;

  items.forEach((item, index) => {
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
    const even = index % 2 === 0;
    doc.setFillColor(even ? 245 : 255, even ? 250 : 255, even ? 247 : 255);
    doc.rect(15, y - 4, 180, 9, "F");

    const displayName = (item.staffName || item.teacherName || "Unknown").substring(0, 38);
    const typeLabel =
      item.staffType === "non-teaching" ? "Non-Teaching" : "Teaching";

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(String(index + 1), 19, y + 2);
    doc.text(displayName, 28, y + 2);
    doc.text(typeLabel, 120, y + 2);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_GREEN);
    doc.text(
      formatCurrencyPlain(item.amount, item.currency || payroll.currency),
      191,
      y + 2,
      { align: "right" }
    );
    y += 9;
  });

  y += 6;
  doc.setDrawColor(...PRIMARY_GREEN);
  doc.setLineWidth(0.6);
  doc.line(120, y, 195, y);
  y += 7;

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_GREEN);
  doc.text("Total Payroll:", 122, y);
  doc.text(
    formatCurrencyPlain(payroll.totalAmount, payroll.currency),
    191,
    y,
    { align: "right" }
  );

  y += 14;

  // Signature
  const PH = doc.internal.pageSize.getHeight();
  const SIG_Y = PH - 28;
  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.3);
  doc.line(15, SIG_Y, 90, SIG_Y);
  doc.line(120, SIG_Y, 195, SIG_Y);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text("Bursar / Authorized Signature", 52, SIG_Y + 5, { align: "center" });
  doc.text("Date / Stamp", 157, SIG_Y + 5, { align: "center" });

  addFooter(doc, branding);
  doc.save(`payroll-${payroll.month}-PAY-${String(payroll.id).padStart(5, "0")}.pdf`);
}
