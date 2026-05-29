import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';

const payrollInclude = {
  employee: {
    select: {
      id: true,
      employeeCode: true,
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  },
} satisfies Prisma.PayrollInclude;

export class PayrollRepository {
  async list(
    companyId: string,
    query: { page: number; limit: number; month?: number; year?: number; employeeId?: string }
  ) {
    const where: Prisma.PayrollWhereInput = {
      employee: { companyId, deletedAt: null },
      ...(query.month && { month: query.month }),
      ...(query.year && { year: query.year }),
      ...(query.employeeId && { employeeId: query.employeeId }),
    };

    const [items, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        include: payrollInclude,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.payroll.count({ where }),
    ]);
    return { items, total };
  }

  async listSalaryStructures(companyId: string) {
    return prisma.salaryStructure.findMany({
      where: { employee: { companyId, deletedAt: null } },
      include: payrollInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertSalaryStructure(data: {
    employeeId: string;
    baseSalary: number;
    allowances: unknown[];
    deductions: unknown[];
    effectiveFrom: Date;
  }) {
    return prisma.salaryStructure.upsert({
      where: { employeeId: data.employeeId },
      update: {
        baseSalary: new Prisma.Decimal(data.baseSalary),
        allowances: data.allowances as Prisma.JsonArray,
        deductions: data.deductions as Prisma.JsonArray,
        effectiveFrom: data.effectiveFrom,
      },
      create: {
        employeeId: data.employeeId,
        baseSalary: new Prisma.Decimal(data.baseSalary),
        allowances: data.allowances as Prisma.JsonArray,
        deductions: data.deductions as Prisma.JsonArray,
        effectiveFrom: data.effectiveFrom,
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });
  }
}

export const payrollRepository = new PayrollRepository();
