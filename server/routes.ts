import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup MUST be before protected routes
  await setupAuth(app);
  registerAuthRoutes(app);

  // Require auth for API routes
  app.use('/api/students', isAuthenticated);
  app.use('/api/payments', isAuthenticated);

  app.get(api.students.list.path, async (req, res) => {
    const search = req.query.search as string | undefined;
    const studentsList = await storage.getStudents(search);
    res.json(studentsList);
  });

  app.get(api.students.get.path, async (req, res) => {
    const student = await storage.getStudent(Number(req.params.id));
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  });

  app.post(api.students.create.path, async (req, res) => {
    try {
      const input = api.students.create.input.parse(req.body);
      const student = await storage.createStudent(input);
      res.status(201).json(student);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.students.update.path, async (req, res) => {
    try {
      const input = api.students.update.input.parse(req.body);
      const student = await storage.updateStudent(Number(req.params.id), input);
      res.json(student);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.students.delete.path, async (req, res) => {
    await storage.deleteStudent(Number(req.params.id));
    res.status(204).send();
  });

  app.get(api.payments.list.path, async (req, res) => {
    const paymentsList = await storage.getPayments();
    res.json(paymentsList);
  });

  app.post(api.payments.create.path, async (req, res) => {
    try {
      const input = api.payments.create.input.extend({
        amount: z.coerce.number(),
        studentId: z.coerce.number()
      }).parse(req.body);

      if (input.feeType === "SSCSE Fee") {
        const student = await storage.getStudent(input.studentId);
        if (!student || student.classGrade !== "Senior 4") {
          return res.status(400).json({
            message: "SSCSE Fee is only available for Senior 4 students",
            field: "feeType",
          });
        }
      }

      const payment = await storage.createPayment(input);
      res.status(201).json(payment);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Seed initial data asynchronously after starting
  setTimeout(async () => {
    try {
      const existingStudents = await storage.getStudents();
      if (existingStudents.length === 0) {
        const student1 = await storage.createStudent({
          admissionNumber: "ADM001",
          fullName: "Alice Johnson",
          classGrade: "Senior 1",
          academicYear: "2023/2024",
          parentPhoneNumber: "+254700000001",
          status: "Active",
          tuitionFee: 50000,
          currency: "UGX"
        });
        
        const student2 = await storage.createStudent({
          admissionNumber: "ADM002",
          fullName: "Bob Smith",
          classGrade: "Senior 4",
          academicYear: "2023/2024",
          parentPhoneNumber: "+254700000002",
          status: "Active",
          tuitionFee: 200,
          currency: "USD"
        });

        await storage.createPayment({
          studentId: student1.id,
          amount: 25000,
          currency: "UGX",
          term: "Term 1",
          feeType: "Tuition Fee",
          receiptNumber: "RCPT001",
          recordedBy: "Admin",
          notes: "First installment"
        });
      }
    } catch (e) {
      console.error("Seed error:", e);
    }
  }, 1000);

  return httpServer;
}
