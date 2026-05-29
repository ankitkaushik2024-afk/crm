import { Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { taskService } from '../services/task.service';

export class TaskController {
  async list(req: AuthenticatedRequest, res: Response) {
    const result = await taskService.list(req.user!, req.query as never);
    return sendPaginated(res, result.items, result.meta);
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await taskService.getById(req.user!, id);
    return sendSuccess(res, data);
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const data = await taskService.create(req.user!, req.body);
    return sendCreated(res, data, 'Task created');
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await taskService.update(req.user!, id, req.body);
    return sendSuccess(res, data, 'Task updated');
  }
}

export const taskController = new TaskController();
