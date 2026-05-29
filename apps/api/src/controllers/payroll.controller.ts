import { Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { payrollService } from '../services/payroll.service';

export class PayrollController {
  async list(req: AuthenticatedRequest, res: Response) {
    const result = await payrollService.list(req.user!, req.query as never);
    return sendPaginated(res, result.items, result.meta);
  }

  async listSalaryStructures(req: AuthenticatedRequest, res: Response) {
    const data = await payrollService.listSalaryStructures(req.user!);
    return sendSuccess(res, data);
  }

  async upsertSalaryStructure(req: AuthenticatedRequest, res: Response) {
    const data = await payrollService.upsertSalaryStructure(req.user!, req.body);
    return sendCreated(res, data, 'Salary structure saved');
  }
}

export const payrollController = new PayrollController();
