import { z } from 'zod';
import { insertStudentSchema, insertPaymentSchema, insertExpenseSchema, insertTeacherSchema, insertPayrollSchema, students, payments, expenses, teachers, payrolls, payrollItems } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  students: {
    list: {
      method: 'GET' as const,
      path: '/api/students' as const,
      input: z.object({ search: z.string().optional() }).optional(),
      responses: {
        200: z.array(z.custom<typeof students.$inferSelect & { totalPaid: number; remainingBalance: number }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/students/:id' as const,
      responses: {
        200: z.custom<typeof students.$inferSelect & { totalPaid: number; remainingBalance: number; payments: typeof payments.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/students' as const,
      input: insertStudentSchema,
      responses: {
        201: z.custom<typeof students.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/students/:id' as const,
      input: insertStudentSchema.partial(),
      responses: {
        200: z.custom<typeof students.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/students/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  payments: {
    list: {
      method: 'GET' as const,
      path: '/api/payments' as const,
      responses: {
        200: z.array(z.custom<typeof payments.$inferSelect & { studentName: string }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/payments' as const,
      input: insertPaymentSchema,
      responses: {
        201: z.custom<typeof payments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  expenses: {
    list: {
      method: 'GET' as const,
      path: '/api/expenses' as const,
      responses: {
        200: z.array(z.custom<typeof expenses.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/expenses' as const,
      input: insertExpenseSchema,
      responses: {
        201: z.custom<typeof expenses.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/expenses/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  teachers: {
    list: {
      method: 'GET' as const,
      path: '/api/teachers' as const,
      responses: {
        200: z.array(z.custom<typeof teachers.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/teachers' as const,
      input: insertTeacherSchema,
      responses: {
        201: z.custom<typeof teachers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/teachers/:id' as const,
      input: insertTeacherSchema.partial(),
      responses: {
        200: z.custom<typeof teachers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/teachers/:id' as const,
      responses: { 204: z.void() },
    },
  },
  payrolls: {
    list: {
      method: 'GET' as const,
      path: '/api/payrolls' as const,
      responses: {
        200: z.array(z.custom<typeof payrolls.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/payrolls/:id' as const,
      responses: {
        200: z.custom<any>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/payrolls' as const,
      input: insertPayrollSchema,
      responses: {
        201: z.custom<any>(),
        400: errorSchemas.validation,
      },
    },
    approve: {
      method: 'PUT' as const,
      path: '/api/payrolls/:id/approve' as const,
      responses: {
        200: z.custom<typeof payrolls.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
    reject: {
      method: 'PUT' as const,
      path: '/api/payrolls/:id/reject' as const,
      responses: {
        200: z.custom<typeof payrolls.$inferSelect>(),
        403: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/payrolls/:id' as const,
      responses: { 204: z.void() },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type StudentResponse = z.infer<typeof api.students.list.responses[200]>[0];
export type PaymentResponse = z.infer<typeof api.payments.list.responses[200]>[0];
export type StudentDetailsResponse = z.infer<typeof api.students.get.responses[200]>;
