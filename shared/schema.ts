import { pgTable, text, serial, integer, boolean, timestamp, varchar, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  admissionNumber: text("admission_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  classGrade: text("class_grade").notNull(),
  academicYear: text("academic_year").notNull(),
  parentPhoneNumber: text("parent_phone_number").notNull(),
  status: text("status").notNull().default("Active"),
  tuitionFee: integer("tuition_fee").notNull().default(0),
  currency: text("currency").notNull().default("UGX"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("UGX"),
  term: text("term").notNull().default("Term 1"),
  feeType: text("fee_type").notNull().default("Tuition Fee"),
  feeBreakdown: text("fee_breakdown"),
  paymentDate: timestamp("payment_date").defaultNow(),
  receiptNumber: text("receipt_number").notNull().unique(),
  recordedBy: text("recorded_by").notNull(),
  notes: text("notes"),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("UGX"),
  term: text("term").notNull().default("Term 1"),
  expenseDate: timestamp("expense_date").defaultNow(),
  recordedBy: text("recorded_by").notNull(),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  subjects: text("subjects").array().notNull(),
  baseSalary: integer("base_salary").notNull().default(0),
  accommodationAllowance: integer("accommodation_allowance").notNull().default(0),
  transportAllowance: integer("transport_allowance").notNull().default(0),
  otherAllowances: integer("other_allowances").notNull().default(0),
  deductions: integer("deductions").notNull().default(0),
  deductionNotes: text("deduction_notes"),
  currency: text("currency").notNull().default("UGX"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const nonTeachingStaff = pgTable("non_teaching_staff", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  position: text("position").notNull(),
  phoneNumber: text("phone_number").notNull(),
  baseSalary: integer("base_salary").notNull().default(0),
  accommodationAllowance: integer("accommodation_allowance").notNull().default(0),
  transportAllowance: integer("transport_allowance").notNull().default(0),
  otherAllowances: integer("other_allowances").notNull().default(0),
  deductions: integer("deductions").notNull().default(0),
  deductionNotes: text("deduction_notes"),
  currency: text("currency").notNull().default("UGX"),
  contractType: text("contract_type").notNull().default("Permanent"),
  status: text("status").notNull().default("Active"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payrolls = pgTable("payrolls", {
  id: serial("id").primaryKey(),
  month: text("month").notNull(),
  status: text("status").notNull().default("Draft"),
  totalAmount: integer("total_amount").notNull().default(0),
  currency: text("currency").notNull().default("UGX"),
  createdBy: text("created_by").notNull(),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payrollItems = pgTable("payroll_items", {
  id: serial("id").primaryKey(),
  payrollId: integer("payroll_id").notNull().references(() => payrolls.id),
  teacherId: integer("teacher_id").references(() => teachers.id),
  nonTeachingStaffId: integer("non_teaching_staff_id").references(() => nonTeachingStaff.id),
  staffType: text("staff_type").notNull().default("teacher"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("UGX"),
});

export const brandingSettings = pgTable("branding_settings", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").notNull().default("HelioPay System"),
  schoolAddress: text("school_address").notNull().default(""),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  term: text("term").notNull(),
  academicYear: text("academic_year").notNull(),
  category: text("category").notNull(),
  estimatedAmount: integer("estimated_amount").notNull().default(0),
  currency: text("currency").notNull().default("UGX"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const feePresets = pgTable("fee_presets", {
  id: serial("id").primaryKey(),
  classGrade: text("class_grade").notNull(),
  term: text("term").notNull(),
  feeType: text("fee_type").notNull(),
  amount: integer("amount").notNull().default(0),
  currency: text("currency").notNull().default("UGX"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shareholders = pgTable("shareholders", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactInfo: text("contact_info").notNull().default(""),
  sharePercentage: numeric("share_percentage", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  shareholderId: integer("shareholder_id").notNull().references(() => shareholders.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  academicYear: text("academic_year").notNull(),
  netProfit: integer("net_profit").notNull(),
  payoutAmount: integer("payout_amount").notNull(),
  currency: text("currency").notNull().default("UGX"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const shareholdersRelations = relations(shareholders, ({ many }) => ({
  payouts: many(payouts),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  shareholder: one(shareholders, {
    fields: [payouts.shareholderId],
    references: [shareholders.id],
  }),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  payments: many(payments),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  payrollItems: many(payrollItems),
}));

export const nonTeachingStaffRelations = relations(nonTeachingStaff, ({ many }) => ({
  payrollItems: many(payrollItems),
}));

export const payrollsRelations = relations(payrolls, ({ many }) => ({
  items: many(payrollItems),
}));

export const payrollItemsRelations = relations(payrollItems, ({ one }) => ({
  payroll: one(payrolls, {
    fields: [payrollItems.payrollId],
    references: [payrolls.id],
  }),
  teacher: one(teachers, {
    fields: [payrollItems.teacherId],
    references: [teachers.id],
  }),
  nonTeachingStaffMember: one(nonTeachingStaff, {
    fields: [payrollItems.nonTeachingStaffId],
    references: [nonTeachingStaff.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
}));

export const insertStudentSchema = createInsertSchema(students).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, paymentDate: true });

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type CreateStudentRequest = InsertStudent;
export type UpdateStudentRequest = Partial<InsertStudent>;
export type StudentResponse = Student & { totalPaid: number; remainingBalance: number };

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, expenseDate: true });

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true, createdAt: true });
export const insertPayrollSchema = createInsertSchema(payrolls).omit({ id: true, totalAmount: true, approvedBy: true, approvedAt: true, createdAt: true });
export const insertNonTeachingStaffSchema = createInsertSchema(nonTeachingStaff).omit({ id: true, createdAt: true });
export const insertBrandingSchema = createInsertSchema(brandingSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBudgetSchema = createInsertSchema(budgets).omit({ id: true, createdAt: true, updatedAt: true });

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Payroll = typeof payrolls.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;

export type PayrollItem = typeof payrollItems.$inferSelect;
export type PayrollWithItems = Payroll & { items: (PayrollItem & { staffName: string })[] };

export type BrandingSettings = typeof brandingSettings.$inferSelect;
export type InsertBranding = z.infer<typeof insertBrandingSchema>;

export type NonTeachingStaff = typeof nonTeachingStaff.$inferSelect;
export type InsertNonTeachingStaff = z.infer<typeof insertNonTeachingStaffSchema>;

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = z.infer<typeof insertBudgetSchema>;

export const insertFeePresetSchema = createInsertSchema(feePresets).omit({ id: true, createdAt: true, updatedAt: true });
export type FeePreset = typeof feePresets.$inferSelect;
export type InsertFeePreset = z.infer<typeof insertFeePresetSchema>;

export type CreatePaymentRequest = InsertPayment;
export type PaymentResponse = Payment & { studentName?: string };

export const insertShareholderSchema = createInsertSchema(shareholders).omit({ id: true, createdAt: true }).extend({
  sharePercentage: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0 && parseFloat(v) <= 100, {
    message: "Share percentage must be between 0.01 and 100",
  }),
});
export type Shareholder = typeof shareholders.$inferSelect;
export type InsertShareholder = z.infer<typeof insertShareholderSchema>;

export const insertPayoutSchema = createInsertSchema(payouts).omit({ id: true, createdAt: true });
export type Payout = typeof payouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;
export type PayoutWithShareholder = Payout & { shareholderName: string; sharePercentage: string };
