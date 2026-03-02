import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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
  tuitionFee: integer("tuition_fee").notNull().default(0), // Total expected fee
  currency: text("currency").notNull().default("UGX"), // UGX or USD
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("UGX"),
  term: text("term").notNull().default("Term 1"),
  feeType: text("fee_type").notNull().default("Tuition Fee"),
  paymentDate: timestamp("payment_date").defaultNow(),
  receiptNumber: text("receipt_number").notNull().unique(),
  recordedBy: text("recorded_by").notNull(),
  notes: text("notes"),
});

export const studentsRelations = relations(students, ({ many }) => ({
  payments: many(payments),
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

export type CreatePaymentRequest = InsertPayment;
export type PaymentResponse = Payment & { studentName?: string };
