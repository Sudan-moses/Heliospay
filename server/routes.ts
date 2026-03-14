import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { authStorage } from "./replit_integrations/auth/storage";
import { insertBrandingSchema, insertNonTeachingStaffSchema, insertBudgetSchema, insertFeePresetSchema } from "@shared/schema";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth setup MUST be before protected routes
  await setupAuth(app);
  registerAuthRoutes(app);

  const isAdmin = async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await authStorage.getUser(userId);
    if (!user || user.role !== "Admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  const canModify = async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user?.claims?.sub;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await authStorage.getUser(userId);
    if (!user || user.role === "Principal" || user.role === "Suspended" || user.role === "Pending") {
      return res.status(403).json({ message: "You do not have permission to perform this action" });
    }
    next();
  };

  const blockInactive = async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user?.claims?.sub;
    if (userId) {
      const user = await authStorage.getUser(userId);
      if (user?.role === "Suspended") {
        return res.status(403).json({ message: "Your account has been suspended" });
      }
      if (user?.role === "Pending") {
        return res.status(403).json({ message: "Your account is pending approval by an administrator" });
      }
    }
    next();
  };

  app.use('/api/students', isAuthenticated, blockInactive);
  app.use('/api/payments', isAuthenticated, blockInactive);

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

  app.post(api.students.create.path, canModify, async (req, res) => {
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

  app.put(api.students.update.path, canModify, async (req, res) => {
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

  app.delete(api.students.delete.path, canModify, async (req, res) => {
    await storage.deleteStudent(Number(req.params.id));
    res.status(204).send();
  });

  app.get(api.payments.list.path, async (req, res) => {
    const paymentsList = await storage.getPayments();
    res.json(paymentsList);
  });

  app.post(api.payments.create.path, canModify, async (req, res) => {
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

  app.delete('/api/payments/:id', isAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid payment ID" });
    await storage.deletePayment(id);
    res.status(204).send();
  });

  app.get('/api/payments/report', isAuthenticated, blockInactive, async (req, res) => {
    const term = req.query.term as string | undefined;
    const classGrade = req.query.classGrade as string | undefined;
    const filtered = await storage.getPaymentsFiltered(term, classGrade);
    res.json(filtered);
  });

  // Expenses routes
  app.use('/api/expenses', isAuthenticated, blockInactive);

  app.get(api.expenses.list.path, async (req, res) => {
    const expensesList = await storage.getExpenses();
    res.json(expensesList);
  });

  app.post(api.expenses.create.path, canModify, async (req, res) => {
    try {
      const input = api.expenses.create.input.extend({
        amount: z.coerce.number().min(1, "Amount must be at least 1"),
      }).parse(req.body);
      const expense = await storage.createExpense(input);
      res.status(201).json(expense);
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

  app.delete(api.expenses.delete.path, canModify, async (req, res) => {
    await storage.deleteExpense(Number(req.params.id));
    res.status(204).send();
  });

  // Teacher routes
  app.use('/api/teachers', isAuthenticated, blockInactive);

  app.get(api.teachers.list.path, async (req, res) => {
    const teachersList = await storage.getTeachers();
    res.json(teachersList);
  });

  app.get('/api/teachers/:id', isAuthenticated, blockInactive, async (req, res) => {
    const teacher = await storage.getTeacher(Number(req.params.id));
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(teacher);
  });

  app.post(api.teachers.create.path, canModify, async (req, res) => {
    try {
      const input = api.teachers.create.input.extend({
        baseSalary: z.coerce.number().min(0),
        accommodationAllowance: z.coerce.number().min(0).optional(),
        transportAllowance: z.coerce.number().min(0).optional(),
        otherAllowances: z.coerce.number().min(0).optional(),
        deductions: z.coerce.number().min(0).optional(),
      }).parse(req.body);
      const teacher = await storage.createTeacher(input);
      res.status(201).json(teacher);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put(api.teachers.update.path, canModify, async (req, res) => {
    try {
      const input = api.teachers.update.input.extend({
        baseSalary: z.coerce.number().min(0).optional(),
        accommodationAllowance: z.coerce.number().min(0).optional(),
        transportAllowance: z.coerce.number().min(0).optional(),
        otherAllowances: z.coerce.number().min(0).optional(),
        deductions: z.coerce.number().min(0).optional(),
      }).parse(req.body);
      const teacher = await storage.updateTeacher(Number(req.params.id), input);
      res.json(teacher);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete(api.teachers.delete.path, canModify, async (req, res) => {
    await storage.deleteTeacher(Number(req.params.id));
    res.status(204).send();
  });

  // Payroll routes
  app.use('/api/payrolls', isAuthenticated, blockInactive);

  app.get(api.payrolls.list.path, async (req, res) => {
    const payrollsList = await storage.getPayrolls();
    res.json(payrollsList);
  });

  app.get('/api/payrolls/:id', async (req, res) => {
    const payroll = await storage.getPayroll(Number(req.params.id));
    if (!payroll) return res.status(404).json({ message: "Payroll not found" });
    res.json(payroll);
  });

  app.post(api.payrolls.create.path, canModify, async (req, res) => {
    try {
      const input = api.payrolls.create.input.parse(req.body);
      const payroll = await storage.createPayroll(input);
      res.status(201).json(payroll);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put('/api/payrolls/:id/approve', isAuthenticated, isAdmin, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const dbUser = await authStorage.getUser(userId);
    const payroll = await storage.updatePayrollStatus(Number(req.params.id), "Approved", dbUser?.email || "Admin");
    res.json(payroll);
  });

  app.put('/api/payrolls/:id/reject', isAuthenticated, isAdmin, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const dbUser = await authStorage.getUser(userId);
    const payroll = await storage.updatePayrollStatus(Number(req.params.id), "Rejected", dbUser?.email || "Admin");
    res.json(payroll);
  });

  app.delete('/api/payrolls/:id', canModify, async (req, res) => {
    await storage.deletePayroll(Number(req.params.id));
    res.status(204).send();
  });

  // Receipt verification (public — no auth needed)
  app.get('/api/verify-receipt', async (req, res) => {
    const receiptNumber = req.query.receiptNumber as string;
    if (!receiptNumber) return res.status(400).json({ message: "Receipt number is required" });
    const result = await storage.getPaymentByReceiptNumber(receiptNumber);
    if (!result) return res.json({ valid: false });
    const { studentName, studentAdmissionNumber, studentClassGrade, ...paymentData } = result;
    const branding = await storage.getBrandingSettings();
    res.json({
      valid: true,
      payment: paymentData,
      student: { fullName: studentName, admissionNumber: studentAdmissionNumber, classGrade: studentClassGrade },
      branding: branding ? { schoolName: branding.schoolName, schoolAddress: branding.schoolAddress } : undefined,
    });
  });

  // Branding settings routes
  app.get('/api/settings/branding', async (req, res) => {
    const settings = await storage.getBrandingSettings();
    res.json(settings || { schoolName: "HelioPay System", schoolAddress: "", logoUrl: null });
  });

  app.put('/api/settings/branding', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const input = insertBrandingSchema.parse(req.body);
      const settings = await storage.updateBrandingSettings(input);
      res.json(settings);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  // Non-teaching staff routes
  app.use('/api/non-teaching-staff', isAuthenticated, blockInactive);

  app.get('/api/non-teaching-staff', async (req, res) => {
    const staff = await storage.getNonTeachingStaff();
    res.json(staff);
  });

  app.post('/api/non-teaching-staff', canModify, async (req, res) => {
    try {
      const input = insertNonTeachingStaffSchema.extend({
        baseSalary: z.coerce.number().min(0),
      }).parse(req.body);
      const staff = await storage.createNonTeachingStaff(input);
      res.status(201).json(staff);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put('/api/non-teaching-staff/:id', canModify, async (req, res) => {
    try {
      const input = insertNonTeachingStaffSchema.partial().extend({
        baseSalary: z.coerce.number().min(0).optional(),
      }).parse(req.body);
      const staff = await storage.updateNonTeachingStaff(Number(req.params.id), input);
      res.json(staff);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete('/api/non-teaching-staff/:id', canModify, async (req, res) => {
    await storage.deleteNonTeachingStaff(Number(req.params.id));
    res.status(204).send();
  });

  app.get('/api/non-teaching-staff/:id', isAuthenticated, blockInactive, async (req, res) => {
    const staff = await storage.getNonTeachingStaffMember(Number(req.params.id));
    if (!staff) return res.status(404).json({ message: "Staff member not found" });
    res.json(staff);
  });

  app.get('/api/staff/:type/:id/payroll-history', isAuthenticated, blockInactive, async (req, res) => {
    const { type, id } = req.params;
    const items = await storage.getPayrollItemsForStaff(type as string, Number(id));
    res.json(items);
  });

  // User management routes (admin only)
  app.get('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    const users = await authStorage.getUsers();
    res.json(users);
  });

  app.put('/api/users/:id/role', isAuthenticated, isAdmin, async (req, res) => {
    const { role } = req.body;
    if (!["Admin", "Bursar", "Principal", "Suspended", "Pending"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }
    const user = await authStorage.updateUserRole(req.params.id as string, role);
    res.json(user);
  });

  app.delete('/api/users/:id', isAuthenticated, isAdmin, async (req: any, res) => {
    const targetId = req.params.id as string;
    const currentUserId = req.user?.claims?.sub;
    if (targetId === currentUserId) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    await authStorage.deleteUser(targetId);
    res.json({ success: true });
  });

  app.get('/api/payments/sscse', isAuthenticated, isAdmin, async (_req, res) => {
    const sscsePayments = await storage.getSSCSEPayments();
    res.json(sscsePayments);
  });

  // Budget routes
  app.use('/api/budgets', isAuthenticated, blockInactive);

  app.get('/api/budgets', async (req, res) => {
    const term = req.query.term as string | undefined;
    const academicYear = req.query.academicYear as string | undefined;
    const budgetList = await storage.getBudgets(term, academicYear);
    res.json(budgetList);
  });

  app.post('/api/budgets', canModify, async (req, res) => {
    try {
      const input = insertBudgetSchema.extend({
        estimatedAmount: z.coerce.number().min(0),
      }).parse(req.body);
      const budget = await storage.createBudget(input);
      res.status(201).json(budget);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put('/api/budgets/:id', canModify, async (req, res) => {
    try {
      const input = insertBudgetSchema.partial().extend({
        estimatedAmount: z.coerce.number().min(0).optional(),
      }).parse(req.body);
      const budget = await storage.updateBudget(Number(req.params.id), input);
      res.json(budget);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete('/api/budgets/:id', canModify, async (req, res) => {
    await storage.deleteBudget(Number(req.params.id));
    res.status(204).send();
  });

  // Fee presets routes
  app.use('/api/fee-presets', isAuthenticated, blockInactive);

  app.get('/api/fee-presets', async (req, res) => {
    const classGrade = req.query.classGrade as string | undefined;
    const currency = req.query.currency as string | undefined;
    const presets = await storage.getFeePresets(classGrade, currency);
    res.json(presets);
  });

  app.post('/api/fee-presets', isAdmin, async (req, res) => {
    try {
      const input = insertFeePresetSchema.extend({
        amount: z.coerce.number().min(0),
      }).parse(req.body);
      const existing = await storage.getFeePresets();
      const duplicate = existing.find(
        (p) => p.classGrade === input.classGrade && p.term === input.term && p.feeType === input.feeType && p.currency === input.currency
      );
      if (duplicate) {
        return res.status(409).json({ message: `A fee preset for ${input.classGrade} / ${input.term} / ${input.feeType} (${input.currency}) already exists. Please edit the existing one instead.` });
      }
      const preset = await storage.createFeePreset(input);
      res.status(201).json(preset);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.put('/api/fee-presets/:id', isAdmin, async (req, res) => {
    try {
      const input = insertFeePresetSchema.partial().extend({
        amount: z.coerce.number().min(0).optional(),
      }).parse(req.body);
      const preset = await storage.updateFeePreset(Number(req.params.id), input);
      res.json(preset);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      throw err;
    }
  });

  app.delete('/api/fee-presets/:id', isAdmin, async (req, res) => {
    await storage.deleteFeePreset(Number(req.params.id));
    res.status(204).send();
  });

  // Financial reports
  app.get('/api/reports/financial-summary', isAuthenticated, blockInactive, async (req, res) => {
    const period = req.query.period as string || "monthly";
    const term = req.query.term as string | undefined;
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === "weekly") {
      startDate = startOfWeek(now, { weekStartsOn: 1 });
      endDate = endOfWeek(now, { weekStartsOn: 1 });
    } else if (period === "termly") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    }

    if (req.query.startDate) startDate = new Date(req.query.startDate as string);
    if (req.query.endDate) endDate = new Date(req.query.endDate as string);

    const summary = await storage.getFinancialSummary(startDate, endDate, term);
    res.json({ ...summary, period, startDate: startDate.toISOString(), endDate: endDate.toISOString() });
  });

  // Budget vs Expenditure comparison
  app.get('/api/reports/budget-vs-actual', isAuthenticated, blockInactive, async (req, res) => {
    const term = req.query.term as string || "Term 1";
    const academicYear = req.query.academicYear as string || "2023/2024";

    const termBudgets = await storage.getBudgets(term, academicYear);
    const [startYear] = academicYear.split("/").map(Number);
    const yearStart = new Date(startYear, 0, 1);
    const yearEnd = new Date(startYear + 1, 11, 31);
    const allExpenses = await storage.getFinancialSummary(yearStart, yearEnd, term);

    const comparison = termBudgets.map(b => {
      const actual = allExpenses.expensesByCategory
        .filter(e => e.category === b.category && e.currency === b.currency)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        category: b.category,
        currency: b.currency,
        estimated: b.estimatedAmount,
        actual,
        variance: b.estimatedAmount - actual,
        status: actual > b.estimatedAmount ? "Over Budget" : actual === b.estimatedAmount ? "On Budget" : "Under Budget",
      };
    });

    res.json(comparison);
  });

  // Shareholder routes (Admin only)
  app.get('/api/shareholders', isAuthenticated, blockInactive, async (req, res) => {
    try {
      const list = await storage.getShareholders();
      res.json(list);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch shareholders" });
    }
  });

  app.post('/api/shareholders', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { insertShareholderSchema } = await import("@shared/schema");
      const data = insertShareholderSchema.parse(req.body);
      // Validate total percentage won't exceed 100
      const existing = await storage.getShareholders();
      const totalExisting = existing.reduce((sum, s) => sum + parseFloat(s.sharePercentage), 0);
      if (totalExisting + parseFloat(data.sharePercentage) > 100) {
        return res.status(400).json({ message: `Total share percentage would exceed 100%. Current total: ${totalExisting.toFixed(2)}%` });
      }
      const s = await storage.createShareholder(data);
      res.status(201).json(s);
    } catch (e: any) {
      if (e?.name === "ZodError") return res.status(400).json({ message: e.errors[0]?.message || "Validation error" });
      res.status(500).json({ message: e?.message || "Failed to create shareholder" });
    }
  });

  app.put('/api/shareholders/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { insertShareholderSchema } = await import("@shared/schema");
      const data = insertShareholderSchema.partial().parse(req.body);
      // Validate total percentage won't exceed 100 (excluding this shareholder)
      const existing = await storage.getShareholders();
      const totalExcludingThis = existing.filter(s => s.id !== id).reduce((sum, s) => sum + parseFloat(s.sharePercentage), 0);
      const newPct = data.sharePercentage ? parseFloat(data.sharePercentage) : 0;
      if (totalExcludingThis + newPct > 100) {
        return res.status(400).json({ message: `Total share percentage would exceed 100%. Other shareholders total: ${totalExcludingThis.toFixed(2)}%` });
      }
      const s = await storage.updateShareholder(id, data);
      res.json(s);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed to update shareholder" });
    }
  });

  app.delete('/api/shareholders/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteShareholder(Number(req.params.id));
      res.status(204).end();
    } catch (e) {
      res.status(500).json({ message: "Failed to delete shareholder" });
    }
  });

  // Payout routes
  app.get('/api/payouts', isAuthenticated, blockInactive, async (req, res) => {
    try {
      const term = req.query.term as string || "Term 1";
      const academicYear = req.query.academicYear as string || "2023/2024";
      const currency = req.query.currency as string || "UGX";
      const list = await storage.getPayouts(term, academicYear, currency);
      res.json(list);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  });

  app.post('/api/payouts/calculate', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { term, academicYear, currency } = req.body;
      if (!term || !academicYear || !currency) {
        return res.status(400).json({ message: "term, academicYear, and currency are required" });
      }

      // Get financial summary for the term
      const [startYear] = academicYear.split("/").map(Number);
      const yearStart = new Date(startYear || new Date().getFullYear(), 0, 1);
      const yearEnd = new Date((startYear || new Date().getFullYear()) + 1, 11, 31);
      const financials = await storage.getFinancialSummary(yearStart, yearEnd, term);

      const netProfit = (financials.netBalance as any)[currency] || 0;

      const shareholdersList = await storage.getShareholders();
      if (shareholdersList.length === 0) {
        return res.status(400).json({ message: "No shareholders registered. Add shareholders first." });
      }

      // Delete existing payouts for this period
      await storage.deletePayoutsForTermYear(term, academicYear, currency);

      // Calculate and save payouts
      const payoutData = shareholdersList.map(sh => ({
        shareholderId: sh.id,
        term,
        academicYear,
        netProfit: Math.max(0, netProfit),
        payoutAmount: netProfit > 0 ? Math.round((parseFloat(sh.sharePercentage) / 100) * netProfit) : 0,
        currency,
      }));

      await storage.savePayouts(payoutData);
      const savedPayouts = await storage.getPayouts(term, academicYear, currency);

      res.json({
        netProfit,
        currency,
        term,
        academicYear,
        payouts: savedPayouts,
        totalAllocated: savedPayouts.reduce((s, p) => s + p.payoutAmount, 0),
        retainedEarnings: Math.max(0, netProfit - savedPayouts.reduce((s, p) => s + p.payoutAmount, 0)),
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed to calculate payouts" });
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
