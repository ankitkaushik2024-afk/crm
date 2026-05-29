import { NotFoundError } from '../utils/errors';
import { payrollRepository } from '../repositories/payroll.repository';
import { employeeRepository } from '../repositories/employee.repository';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

function decimalToNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (value && typeof value === 'object' && 'toString' in value) {
    return Number((value as { toString: () => string }).toString());
  }
  return 0;
}

export class PayrollService {
  async list(
    user: NonNullable<AuthenticatedRequest['user']>,
    query: { page: number; limit: number; month?: number; year?: number; employeeId?: string }
  ) {
    const { items, total } = await payrollRepository.list(user.companyId, query);
    return {
      items: items.map((p) => ({
        ...p,
        baseSalary: decimalToNumber(p.baseSalary),
        allowances: decimalToNumber(p.allowances),
        deductions: decimalToNumber(p.deductions),
        bonus: decimalToNumber(p.bonus),
        tax: decimalToNumber(p.tax),
        netSalary: decimalToNumber(p.netSalary),
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async listSalaryStructures(user: NonNullable<AuthenticatedRequest['user']>) {
    const rows = await payrollRepository.listSalaryStructures(user.companyId);
    return rows.map((r) => ({
      ...r,
      baseSalary: decimalToNumber(r.baseSalary),
    }));
  }

  async upsertSalaryStructure(
    user: NonNullable<AuthenticatedRequest['user']>,
    input: {
      employeeId: string;
      baseSalary: number;
      allowances: Array<{ label: string; amount: number }>;
      deductions: Array<{ label: string; amount: number }>;
      effectiveFrom: string;
    }
  ) {
    const employee = await employeeRepository.findById(input.employeeId, user.companyId);
    if (!employee) throw new NotFoundError('Employee not found');
    const result = await payrollRepository.upsertSalaryStructure({
      employeeId: input.employeeId,
      baseSalary: input.baseSalary,
      allowances: input.allowances,
      deductions: input.deductions,
      effectiveFrom: new Date(input.effectiveFrom),
    });
    return { ...result, baseSalary: decimalToNumber(result.baseSalary) };
  }
}

export const payrollService = new PayrollService();
