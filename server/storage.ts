import { db } from "./db";
import {
  students,
  payments,
  paymentItems,
  expenses,
  teachers,
  payrolls,
  payrollItems,
  brandingSettings,
  nonTeachingStaff,
  budgets,
  feePresets,
  shareholders,
  payouts,
  type Student,
  type InsertStudent,
  type Payment,
  type InsertPayment,
  type PaymentFeeItemDto,
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
  type Budget,
  type InsertBudget,
  type FeePreset,
  type InsertFeePreset,
  type Shareholder,
  type InsertShareholder,
  type Payout,
  type InsertPayout,
  type PayoutWithShareholder,
} from "@shared/schema";
import { eq, desc, ilike, or, sum, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  getStudents(search?: string): Promise<(Student & { totalPaid: number; remainingBalance: number })[]>;
  getStudent(id: number): Promise<(Student & { totalPaid: number; remainingBalance: number; payments: Payment[] }) | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: UpdateStudentRequest): Promise<Student>;
  deleteStudent(id: number): Promise<void>;
  
  getPayments(): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string; studentAcademicYear: string; items: PaymentFeeItemDto[] })[]>;
  createPayment(payment: InsertPayment): Promise<Payment & { items: PaymentFeeItemDto[] }>;
  deletePayment(id: number): Promise<void>;

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

  getNonTeachingStaffMember(id: number): Promise<NonTeachingStaff | undefined>;

  getSSCSEPayments(): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string })[]>;

  getPaymentByReceiptNumber(receiptNumber: string): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string; items: PaymentFeeItemDto[] }) | undefined>;

  getPaymentsFiltered(term?: string, classGrade?: string): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string; items: PaymentFeeItemDto[] })[]>;

  getPayrollItemsForStaff(staffType: string, staffId: number): Promise<(PayrollItem & { payrollMonth: string; payrollStatus: string })[]>;

  getBudgets(term?: string, academicYear?: string): Promise<Budget[]>;
  createBudget(data: InsertBudget): Promise<Budget>;
  updateBudget(id: number, data: Partial<InsertBudget>): Promise<Budget>;
  deleteBudget(id: number): Promise<void>;

  getFeePresets(classGrade?: string, currency?: string): Promise<FeePreset[]>;
  getFeePresetsForClass(classGrade: string, currency: string): Promise<FeePreset[]>;
  createFeePreset(data: InsertFeePreset): Promise<FeePreset>;
  updateFeePreset(id: number, data: Partial<InsertFeePreset>): Promise<FeePreset>;
  deleteFeePreset(id: number): Promise<void>;

  getFinancialSummary(startDate: Date, endDate: Date, term?: string): Promise<{
    totalIncome: { UGX: number; USD: number };
    totalExpenses: { UGX: number; USD: number };
    netBalance: { UGX: number; USD: number };
    expensesByCategory: { category: string; amount: number; currency: string }[];
    incomeByFeeType: { feeType: string; amount: number; currency: string }[];
  }>;

  getShareholders(): Promise<Shareholder[]>;
  getShareholder(id: number): Promise<Shareholder | undefined>;
  createShareholder(data: InsertShareholder): Promise<Shareholder>;
  updateShareholder(id: number, data: Partial<InsertShareholder>): Promise<Shareholder>;
  deleteShareholder(id: number): Promise<void>;
  getPayouts(term: string, academicYear: string, currency: string): Promise<PayoutWithShareholder[]>;
  savePayouts(payoutData: InsertPayout[]): Promise<Payout[]>;
  deletePayoutsForTermYear(term: string, academicYear: string, currency: string): Promise<void>;
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
    if (studentData.classGrade && (!studentData.tuitionFee || studentData.tuitionFee === 0)) {
      const presets = await this.getFeePresetsForClass(studentData.classGrade, studentData.currency || "UGX");
      if (presets.length > 0) {
        const totalFromPresets = presets.reduce((sum, p) => sum + p.amount, 0);
        studentData = { ...studentData, tuitionFee: totalFromPresets };
      }
    }
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

  private parseFeeItems(payment: Payment): PaymentFeeItemDto[] {
    if (payment.feeBreakdown) {
      try {
        const parsed = JSON.parse(payment.feeBreakdown);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((i: any) => ({
            feeType: i.feeType || payment.feeType,
            amount: Number(i.amount) || 0,
            currency: payment.currency,
          }));
        }
      } catch {}
    }
    return [{ feeType: payment.feeType, amount: payment.amount, currency: payment.currency }];
  }

  async getPayments(): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string; studentAcademicYear: string; items: PaymentFeeItemDto[] })[]> {
    const allPayments = await db.select().from(payments).orderBy(desc(payments.paymentDate));
    const allStudents = await db.select().from(students);
    const allItems = await db.select().from(paymentItems);

    return allPayments.map(payment => {
      const student = allStudents.find(s => s.id === payment.studentId);
      const dbItems = allItems.filter(i => i.paymentId === payment.id);
      const items: PaymentFeeItemDto[] = dbItems.length > 0
        ? dbItems.map(i => ({ feeType: i.feeType, amount: i.amount, currency: i.currency }))
        : this.parseFeeItems(payment);
      return {
        ...payment,
        studentName: student?.fullName || 'Unknown',
        studentAdmissionNumber: student?.admissionNumber || 'N/A',
        studentClassGrade: student?.classGrade || 'N/A',
        studentAcademicYear: student?.academicYear || 'N/A',
        items,
      };
    });
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment & { items: PaymentFeeItemDto[] }> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    const feeItems = this.parseFeeItems(payment);
    if (feeItems.length > 0) {
      await db.insert(paymentItems).values(
        feeItems.map(i => ({
          paymentId: payment.id,
          feeType: i.feeType,
          amount: i.amount,
          currency: i.currency,
        }))
      );
    }
    return { ...payment, items: feeItems };
  }

  async deletePayment(id: number): Promise<void> {
    await db.delete(paymentItems).where(eq(paymentItems.paymentId, id));
    await db.delete(payments).where(eq(payments.id, id));
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
    const allNTS = await db.select().from(nonTeachingStaff);

    const itemsWithNames = items.map(item => {
      let staffName = "Unknown";
      if (item.staffType === "non-teaching" && item.nonTeachingStaffId) {
        staffName = allNTS.find(s => s.id === item.nonTeachingStaffId)?.fullName || "Unknown";
      } else if (item.teacherId) {
        staffName = allTeachers.find(t => t.id === item.teacherId)?.fullName || "Unknown";
      }
      return { ...item, staffName };
    });

    return { ...payroll, items: itemsWithNames };
  }

  async createPayroll(data: InsertPayroll): Promise<PayrollWithItems> {
    const activeTeachers = await db.select().from(teachers).where(eq(teachers.status, "Active"));
    const activeNTS = await db.select().from(nonTeachingStaff).where(eq(nonTeachingStaff.status, "Active"));
    const payrollCurrency = data.currency || "UGX";
    const eligibleTeachers = activeTeachers.filter(t => t.baseSalary > 0 && t.currency === payrollCurrency);
    const eligibleNTS = activeNTS.filter(s => s.baseSalary > 0 && s.currency === payrollCurrency);

    const getNetSalary = (s: { baseSalary: number; accommodationAllowance: number; transportAllowance: number; otherAllowances: number; deductions: number }) =>
      s.baseSalary + (s.accommodationAllowance || 0) + (s.transportAllowance || 0) + (s.otherAllowances || 0) - (s.deductions || 0);

    const teacherTotal = eligibleTeachers.reduce((sum, t) => sum + getNetSalary(t), 0);
    const ntsTotal = eligibleNTS.reduce((sum, s) => sum + getNetSalary(s), 0);
    const totalAmount = teacherTotal + ntsTotal;

    const [payroll] = await db.insert(payrolls).values({
      month: data.month,
      status: "Draft",
      createdBy: data.createdBy,
      totalAmount,
      currency: payrollCurrency,
    }).returning();

    const teacherItems = eligibleTeachers.map(t => ({
      payrollId: payroll.id,
      teacherId: t.id,
      nonTeachingStaffId: null as number | null,
      staffType: "teacher" as const,
      amount: getNetSalary(t),
      currency: t.currency,
    }));

    const ntsItems = eligibleNTS.map(s => ({
      payrollId: payroll.id,
      teacherId: null as number | null,
      nonTeachingStaffId: s.id,
      staffType: "non-teaching" as const,
      amount: getNetSalary(s),
      currency: s.currency,
    }));

    const itemsToInsert = [...teacherItems, ...ntsItems];

    let insertedItems: PayrollItem[] = [];
    if (itemsToInsert.length > 0) {
      insertedItems = await db.insert(payrollItems).values(itemsToInsert).returning();
    }

    const itemsWithNames = insertedItems.map(item => {
      let staffName = "Unknown";
      if (item.staffType === "non-teaching" && item.nonTeachingStaffId) {
        staffName = eligibleNTS.find(s => s.id === item.nonTeachingStaffId)?.fullName || "Unknown";
      } else if (item.teacherId) {
        staffName = eligibleTeachers.find(t => t.id === item.teacherId)?.fullName || "Unknown";
      }
      return { ...item, staffName };
    });

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
    await db.delete(payrollItems).where(eq(payrollItems.nonTeachingStaffId, id));
    await db.delete(nonTeachingStaff).where(eq(nonTeachingStaff.id, id));
  }

  async getNonTeachingStaffMember(id: number): Promise<NonTeachingStaff | undefined> {
    const [staff] = await db.select().from(nonTeachingStaff).where(eq(nonTeachingStaff.id, id));
    return staff;
  }

  async getSSCSEPayments(): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string })[]> {
    const allPayments = await db.select().from(payments).where(eq(payments.feeType, "SSCSE Fee")).orderBy(desc(payments.paymentDate));
    const allStudents = await db.select().from(students);
    return allPayments.map(payment => {
      const student = allStudents.find(s => s.id === payment.studentId);
      return {
        ...payment,
        studentName: student?.fullName || "Unknown",
        studentAdmissionNumber: student?.admissionNumber || "N/A",
        studentClassGrade: student?.classGrade || "N/A",
      };
    });
  }

  async getPaymentByReceiptNumber(receiptNumber: string): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string; items: PaymentFeeItemDto[] }) | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.receiptNumber, receiptNumber));
    if (!payment) return undefined;
    const [student] = await db.select().from(students).where(eq(students.id, payment.studentId));
    const dbItems = await db.select().from(paymentItems).where(eq(paymentItems.paymentId, payment.id));
    const items: PaymentFeeItemDto[] = dbItems.length > 0
      ? dbItems.map(i => ({ feeType: i.feeType, amount: i.amount, currency: i.currency }))
      : this.parseFeeItems(payment);
    return {
      ...payment,
      studentName: student?.fullName || "Unknown",
      studentAdmissionNumber: student?.admissionNumber || "N/A",
      studentClassGrade: student?.classGrade || "N/A",
      items,
    };
  }

  async getPaymentsFiltered(term?: string, classGrade?: string): Promise<(Payment & { studentName: string; studentAdmissionNumber: string; studentClassGrade: string; items: PaymentFeeItemDto[] })[]> {
    const allPayments = await db.select().from(payments).orderBy(desc(payments.paymentDate));
    const allStudents = await db.select().from(students);
    const allItems = await db.select().from(paymentItems);

    return allPayments
      .map(payment => {
        const student = allStudents.find(s => s.id === payment.studentId);
        const dbItems = allItems.filter(i => i.paymentId === payment.id);
        const items: PaymentFeeItemDto[] = dbItems.length > 0
          ? dbItems.map(i => ({ feeType: i.feeType, amount: i.amount, currency: i.currency }))
          : this.parseFeeItems(payment);
        return {
          ...payment,
          studentName: student?.fullName || 'Unknown',
          studentAdmissionNumber: student?.admissionNumber || 'N/A',
          studentClassGrade: student?.classGrade || 'N/A',
          items,
        };
      })
      .filter(p => {
        if (term && p.term !== term) return false;
        if (classGrade && p.studentClassGrade !== classGrade) return false;
        return true;
      });
  }

  async getPayrollItemsForStaff(staffType: string, staffId: number): Promise<(PayrollItem & { payrollMonth: string; payrollStatus: string })[]> {
    const condition = staffType === "teacher"
      ? eq(payrollItems.teacherId, staffId)
      : eq(payrollItems.nonTeachingStaffId, staffId);

    const items = await db.select().from(payrollItems).where(condition);
    const allPayrolls = await db.select().from(payrolls);

    return items.map(item => {
      const payroll = allPayrolls.find(p => p.id === item.payrollId);
      return {
        ...item,
        payrollMonth: payroll?.month || "Unknown",
        payrollStatus: payroll?.status || "Unknown",
      };
    });
  }

  async getBudgets(term?: string, academicYear?: string): Promise<Budget[]> {
    const conditions = [];
    if (term) conditions.push(eq(budgets.term, term));
    if (academicYear) conditions.push(eq(budgets.academicYear, academicYear));
    if (conditions.length > 0) {
      return await db.select().from(budgets).where(and(...conditions)).orderBy(budgets.category);
    }
    return await db.select().from(budgets).orderBy(desc(budgets.createdAt));
  }

  async createBudget(data: InsertBudget): Promise<Budget> {
    const [budget] = await db.insert(budgets).values(data).returning();
    return budget;
  }

  async updateBudget(id: number, data: Partial<InsertBudget>): Promise<Budget> {
    const [updated] = await db.update(budgets).set({ ...data, updatedAt: new Date() }).where(eq(budgets.id, id)).returning();
    return updated;
  }

  async deleteBudget(id: number): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, id));
  }

  async getFinancialSummary(startDate: Date, endDate: Date, term?: string): Promise<{
    totalIncome: { UGX: number; USD: number };
    totalExpenses: { UGX: number; USD: number };
    netBalance: { UGX: number; USD: number };
    expensesByCategory: { category: string; amount: number; currency: string }[];
    incomeByFeeType: { feeType: string; amount: number; currency: string }[];
  }> {
    const paymentConditions = [gte(payments.paymentDate, startDate), lte(payments.paymentDate, endDate)];
    if (term) paymentConditions.push(eq(payments.term, term));
    const allPayments = await db.select().from(payments).where(and(...paymentConditions));

    const expenseConditions = [gte(expenses.expenseDate, startDate), lte(expenses.expenseDate, endDate)];
    if (term) expenseConditions.push(eq(expenses.term, term));
    const allExpenses = await db.select().from(expenses).where(and(...expenseConditions));

    const totalIncome = { UGX: 0, USD: 0 };
    const totalExpenses = { UGX: 0, USD: 0 };

    allPayments.forEach(p => {
      if (p.feeType === "SSCSE Fee") return; // SSCSE is pass-through escrow, excluded from net profit
      if (p.currency === "USD") totalIncome.USD += p.amount;
      else totalIncome.UGX += p.amount;
    });

    allExpenses.forEach(e => {
      if (e.currency === "USD") totalExpenses.USD += e.amount;
      else totalExpenses.UGX += e.amount;
    });

    const expenseByCatMap = new Map<string, { amount: number; currency: string }>();
    allExpenses.forEach(e => {
      const key = `${e.category}-${e.currency}`;
      const existing = expenseByCatMap.get(key);
      if (existing) existing.amount += e.amount;
      else expenseByCatMap.set(key, { amount: e.amount, currency: e.currency });
    });

    const incomeByCatMap = new Map<string, { amount: number; currency: string }>();
    allPayments.forEach(p => {
      const key = `${p.feeType}-${p.currency}`;
      const existing = incomeByCatMap.get(key);
      if (existing) existing.amount += p.amount;
      else incomeByCatMap.set(key, { amount: p.amount, currency: p.currency });
    });

    return {
      totalIncome,
      totalExpenses,
      netBalance: {
        UGX: totalIncome.UGX - totalExpenses.UGX,
        USD: totalIncome.USD - totalExpenses.USD,
      },
      expensesByCategory: Array.from(expenseByCatMap.entries()).map(([k, v]) => ({
        category: k.split("-")[0],
        ...v,
      })),
      incomeByFeeType: Array.from(incomeByCatMap.entries()).map(([k, v]) => ({
        feeType: k.split("-")[0],
        ...v,
      })),
    };
  }

  async getFeePresets(classGrade?: string, currency?: string): Promise<FeePreset[]> {
    const conditions = [];
    if (classGrade) conditions.push(eq(feePresets.classGrade, classGrade));
    if (currency) conditions.push(eq(feePresets.currency, currency));
    if (conditions.length > 0) {
      return await db.select().from(feePresets).where(and(...conditions)).orderBy(feePresets.classGrade, feePresets.feeType);
    }
    return await db.select().from(feePresets).orderBy(feePresets.classGrade, feePresets.feeType);
  }

  async getFeePresetsForClass(classGrade: string, currency: string): Promise<FeePreset[]> {
    return await db.select().from(feePresets).where(
      and(eq(feePresets.classGrade, classGrade), eq(feePresets.currency, currency))
    );
  }

  async createFeePreset(data: InsertFeePreset): Promise<FeePreset> {
    const [preset] = await db.insert(feePresets).values(data).returning();
    return preset;
  }

  async updateFeePreset(id: number, data: Partial<InsertFeePreset>): Promise<FeePreset> {
    const [updated] = await db.update(feePresets).set({ ...data, updatedAt: new Date() }).where(eq(feePresets.id, id)).returning();
    return updated;
  }

  async deleteFeePreset(id: number): Promise<void> {
    await db.delete(feePresets).where(eq(feePresets.id, id));
  }

  async getShareholders(): Promise<Shareholder[]> {
    return await db.select().from(shareholders).orderBy(shareholders.createdAt);
  }

  async getShareholder(id: number): Promise<Shareholder | undefined> {
    const [s] = await db.select().from(shareholders).where(eq(shareholders.id, id));
    return s;
  }

  async createShareholder(data: InsertShareholder): Promise<Shareholder> {
    const [s] = await db.insert(shareholders).values(data).returning();
    return s;
  }

  async updateShareholder(id: number, data: Partial<InsertShareholder>): Promise<Shareholder> {
    const [s] = await db.update(shareholders).set(data).where(eq(shareholders.id, id)).returning();
    return s;
  }

  async deleteShareholder(id: number): Promise<void> {
    await db.delete(shareholders).where(eq(shareholders.id, id));
  }

  async getPayouts(term: string, academicYear: string, currency: string): Promise<PayoutWithShareholder[]> {
    const allPayouts = await db.select().from(payouts)
      .where(and(eq(payouts.term, term), eq(payouts.academicYear, academicYear), eq(payouts.currency, currency)))
      .orderBy(desc(payouts.createdAt));

    if (allPayouts.length === 0) return [];

    const allShareholders = await db.select().from(shareholders);
    const shareholderMap = new Map(allShareholders.map(s => [s.id, s]));

    return allPayouts.map(p => {
      const sh = shareholderMap.get(p.shareholderId);
      return {
        ...p,
        shareholderName: sh?.name || "Unknown",
        sharePercentage: sh?.sharePercentage || "0",
      };
    });
  }

  async savePayouts(payoutData: InsertPayout[]): Promise<Payout[]> {
    if (payoutData.length === 0) return [];
    return await db.insert(payouts).values(payoutData).returning();
  }

  async deletePayoutsForTermYear(term: string, academicYear: string, currency: string): Promise<void> {
    await db.delete(payouts).where(
      and(eq(payouts.term, term), eq(payouts.academicYear, academicYear), eq(payouts.currency, currency))
    );
  }
}

export const storage = new DatabaseStorage();
