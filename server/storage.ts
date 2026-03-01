import { db } from "./db";
import {
  students,
  payments,
  type Student,
  type InsertStudent,
  type Payment,
  type InsertPayment,
  type UpdateStudentRequest,
} from "@shared/schema";
import { eq, desc, ilike, or } from "drizzle-orm";

export interface IStorage {
  getStudents(search?: string): Promise<(Student & { totalPaid: number; remainingBalance: number })[]>;
  getStudent(id: number): Promise<(Student & { totalPaid: number; remainingBalance: number; payments: Payment[] }) | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: UpdateStudentRequest): Promise<Student>;
  deleteStudent(id: number): Promise<void>;
  
  getPayments(): Promise<(Payment & { studentName: string })[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
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

  async getPayments(): Promise<(Payment & { studentName: string })[]> {
    const allPayments = await db.select().from(payments).orderBy(desc(payments.paymentDate));
    const allStudents = await db.select().from(students);
    
    return allPayments.map(payment => {
      const student = allStudents.find(s => s.id === payment.studentId);
      return {
        ...payment,
        studentName: student ? student.fullName : 'Unknown'
      };
    });
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
  }
}

export const storage = new DatabaseStorage();
