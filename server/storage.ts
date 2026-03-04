import { db } from "./db";
import {
  students,
  payments,
  expenses,
  teachers,
  payrolls,
  payrollItems,
  brandingSettings,
  nonTeachingStaff,
  type Student,
  type InsertStudent,
  type Payment,
  type InsertPayment,
  type UpdateStudentRequest,
  type Expense,
  type InsertExpense,
  type Teacher,
  type InsertTeacher,
  type Payroll,
  type InsertPayroll,
  type PayrollItem,
  type PayrollWithItems,
  type BrandingSettings,
  type InsertBranding,
  type NonTeachingStaff,
  type InsertNonTeachingStaff,
} from "@shared/schema";
import { eq, desc, ilike, or, sum } from "drizzle-orm";

export interface IStorage {
  getStudents(search?: string): Promise<(Student & { totalPaid: number; remainingBalance: number })[]>;
  getStudent(id: number): Promise<(Student & { totalPaid: number; remainingBalance: number; payments: Payment[] }) | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: UpdateStudentRequest): Promise<Student>;
  deleteStudent(id: number): Promise<void>;
  
  getPayments(): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string; studentAcademicYear: string })[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  getExpenses(): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: number): Promise<void>;

  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacher: Partial<InsertTeacher>): Promise<Teacher>;
  deleteTeacher(id: number): Promise<void>;

  getPayrolls(): Promise<Payroll[]>;
  getPayroll(id: number): Promise<PayrollWithItems | undefined>;
  createPayroll(data: InsertPayroll): Promise<PayrollWithItems>;
  updatePayrollStatus(id: number, status: string, approvedBy?: string): Promise<Payroll>;
  deletePayroll(id: number): Promise<void>;

  getBrandingSettings(): Promise<BrandingSettings | undefined>;
  updateBrandingSettings(data: InsertBranding): Promise<BrandingSettings>;

  getNonTeachingStaff(): Promise<NonTeachingStaff[]>;
  createNonTeachingStaff(data: InsertNonTeachingStaff): Promise<NonTeachingStaff>;
  updateNonTeachingStaff(id: number, data: Partial<InsertNonTeachingStaff>): Promise<NonTeachingStaff>;
  deleteNonTeachingStaff(id: number): Promise<void>;

  getPaymentByReceiptNumber(receiptNumber: string): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string }) | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getStudents(search?: string): Promise<(Student & { totalPaid: number; remainingBalance: number })[]> {
    let query = db.select().from(students);
    if (search) {
      query = query.where(
        or(
          ilike(students.fullName, `%${search}%`),
          ilike(students.admissionNumber, `%${search}%`)
        )
      ) as any;
    }
    
    const allStudents = await query;
    const allPayments = await db.select().from(payments);
    
    return allStudents.map(student => {
      const studentPayments = allPayments.filter(p => p.studentId === student.id && p.currency === student.currency);
      const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      return {
        ...student,
        totalPaid,
        remainingBalance: student.tuitionFee - totalPaid
      };
    });
  }

  async getStudent(id: number): Promise<(Student & { totalPaid: number; remainingBalance: number; payments: Payment[] }) | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    if (!student) return undefined;
    
    const studentPayments = await db.select().from(payments).where(eq(payments.studentId, id)).orderBy(desc(payments.paymentDate));
    const totalPaid = studentPayments.filter(p => p.currency === student.currency).reduce((sum, p) => sum + p.amount, 0);
    
    return {
      ...student,
      totalPaid,
      remainingBalance: student.tuitionFee - totalPaid,
      payments: studentPayments
    };
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const [student] = await db.insert(students).values(studentData).returning();
    return student;
  }

  async updateStudent(id: number, updates: UpdateStudentRequest): Promise<Student> {
    const [updated] = await db.update(students).set(updates).where(eq(students.id, id)).returning();
    return updated;
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(payments).where(eq(payments.studentId, id));
    await db.delete(students).where(eq(students.id, id));
  }

  async getPayments(): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string; studentAcademicYear: string })[]> {
    const allPayments = await db.select().from(payments).orderBy(desc(payments.paymentDate));
    const allStudents = await db.select().from(students);
    
    return allPayments.map(payment => {
      const student = allStudents.find(s => s.id === payment.studentId);
      return {
        ...payment,
        studentName: student?.fullName || 'Unknown',
        studentAdmissionNumber: student?.admissionNumber || 'N/A',
        studentClassGrade: student?.classGrade || 'N/A',
        studentAcademicYear: student?.academicYear || 'N/A',
      };
    });
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
  }

  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses).orderBy(desc(expenses.expenseDate));
  }

  async createExpense(expenseData: InsertExpense): Promise<Expense> {
    const [expense] = await db.insert(expenses).values(expenseData).returning();
    return expense;
  }

  async deleteExpense(id: number): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers).orderBy(desc(teachers.createdAt));
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async createTeacher(teacherData: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db.insert(teachers).values(teacherData).returning();
    return teacher;
  }

  async updateTeacher(id: number, updates: Partial<InsertTeacher>): Promise<Teacher> {
    const [updated] = await db.update(teachers).set(updates).where(eq(teachers.id, id)).returning();
    return updated;
  }

  async deleteTeacher(id: number): Promise<void> {
    await db.delete(payrollItems).where(eq(payrollItems.teacherId, id));
    await db.delete(teachers).where(eq(teachers.id, id));
  }

  async getPayrolls(): Promise<Payroll[]> {
    return await db.select().from(payrolls).orderBy(desc(payrolls.createdAt));
  }

  async getPayroll(id: number): Promise<PayrollWithItems | undefined> {
    const [payroll] = await db.select().from(payrolls).where(eq(payrolls.id, id));
    if (!payroll) return undefined;

    const items = await db.select().from(payrollItems).where(eq(payrollItems.payrollId, id));
    const allTeachers = await db.select().from(teachers);

    const itemsWithNames = items.map(item => ({
      ...item,
      teacherName: allTeachers.find(t => t.id === item.teacherId)?.fullName || "Unknown",
    }));

    return { ...payroll, items: itemsWithNames };
  }

  async createPayroll(data: InsertPayroll): Promise<PayrollWithItems> {
    const activeTeachers = await db.select().from(teachers).where(eq(teachers.status, "Active"));
    const payrollCurrency = data.currency || "UGX";
    const eligibleTeachers = activeTeachers.filter(t => t.baseSalary > 0 && t.currency === payrollCurrency);

    const getNetSalary = (t: typeof activeTeachers[0]) =>
      t.baseSalary + (t.accommodationAllowance || 0) + (t.transportAllowance || 0) + (t.otherAllowances || 0) - (t.deductions || 0);

    const totalAmount = eligibleTeachers.reduce((sum, t) => sum + getNetSalary(t), 0);

    const [payroll] = await db.insert(payrolls).values({
      month: data.month,
      status: "Draft",
      createdBy: data.createdBy,
      totalAmount,
      currency: payrollCurrency,
    }).returning();

    const itemsToInsert = eligibleTeachers.map(t => ({
      payrollId: payroll.id,
      teacherId: t.id,
      amount: getNetSalary(t),
      currency: t.currency,
    }));

    let insertedItems: PayrollItem[] = [];
    if (itemsToInsert.length > 0) {
      insertedItems = await db.insert(payrollItems).values(itemsToInsert).returning();
    }

    const itemsWithNames = insertedItems.map(item => ({
      ...item,
      teacherName: eligibleTeachers.find(t => t.id === item.teacherId)?.fullName || "Unknown",
    }));

    return { ...payroll, items: itemsWithNames };
  }

  async updatePayrollStatus(id: number, status: string, approvedBy?: string): Promise<Payroll> {
    const updates: any = { status };
    if (approvedBy) {
      updates.approvedBy = approvedBy;
      updates.approvedAt = new Date();
    }
    const [updated] = await db.update(payrolls).set(updates).where(eq(payrolls.id, id)).returning();
    return updated;
  }

  async deletePayroll(id: number): Promise<void> {
    await db.delete(payrollItems).where(eq(payrollItems.payrollId, id));
    await db.delete(payrolls).where(eq(payrolls.id, id));
  }

  async getBrandingSettings(): Promise<BrandingSettings | undefined> {
    const [settings] = await db.select().from(brandingSettings).limit(1);
    return settings;
  }

  async updateBrandingSettings(data: InsertBranding): Promise<BrandingSettings> {
    const existing = await this.getBrandingSettings();
    if (existing) {
      const [updated] = await db.update(brandingSettings).set({ ...data, updatedAt: new Date() }).where(eq(brandingSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(brandingSettings).values(data).returning();
    return created;
  }

  async getNonTeachingStaff(): Promise<NonTeachingStaff[]> {
    return await db.select().from(nonTeachingStaff).orderBy(desc(nonTeachingStaff.createdAt));
  }

  async createNonTeachingStaff(data: InsertNonTeachingStaff): Promise<NonTeachingStaff> {
    const [staff] = await db.insert(nonTeachingStaff).values(data).returning();
    return staff;
  }

  async updateNonTeachingStaff(id: number, data: Partial<InsertNonTeachingStaff>): Promise<NonTeachingStaff> {
    const [updated] = await db.update(nonTeachingStaff).set(data).where(eq(nonTeachingStaff.id, id)).returning();
    return updated;
  }

  async deleteNonTeachingStaff(id: number): Promise<void> {
    await db.delete(nonTeachingStaff).where(eq(nonTeachingStaff.id, id));
  }

  async getPaymentByReceiptNumber(receiptNumber: string): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string }) | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.receiptNumber, receiptNumber));
    if (!payment) return undefined;
    const [student] = await db.select().from(students).where(eq(students.id, payment.studentId));
    return {
      ...payment,
      studentName: student?.fullName || "Unknown",
      studentAdmissionNumber: student?.admissionNumber || "N/A",
      studentClassGrade: student?.classGrade || "N/A",
    };
  }
}

export const storage = new DatabaseStorage();
