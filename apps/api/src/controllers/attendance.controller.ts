import { Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { sendSuccess, sendPaginated } from '../utils/response';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';

export class AttendanceController {
  async checkIn(req: AuthenticatedRequest, res: Response) {
    const data = await attendanceService.checkIn(req.user!, req.body);
    return sendSuccess(res, data, 'Checked in successfully');
  }

  async checkOut(req: AuthenticatedRequest, res: Response) {
    const data = await attendanceService.checkOut(req.user!, req.body);
    return sendSuccess(res, data, 'Checked out successfully');
  }

  async today(req: AuthenticatedRequest, res: Response) {
    const employeeId = req.query.employeeId as string | undefined;
    const data = await attendanceService.getToday(req.user!, employeeId);
    return sendSuccess(res, data);
  }

  async list(req: AuthenticatedRequest, res: Response) {
    const result = await attendanceService.list(req.user!, req.query as never);
    return sendPaginated(res, result.items, result.meta);
  }
}

export const attendanceController = new AttendanceController();
