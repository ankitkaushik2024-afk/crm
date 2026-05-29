import { Response } from 'express';
import { sendCreated, sendPaginated, sendSuccess } from '../utils/response';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { projectService } from '../services/project.service';

export class ProjectController {
  async list(req: AuthenticatedRequest, res: Response) {
    const result = await projectService.list(req.user!, req.query as never);
    return sendPaginated(res, result.items, result.meta);
  }

  async getById(req: AuthenticatedRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await projectService.getById(req.user!, id);
    return sendSuccess(res, data);
  }

  async create(req: AuthenticatedRequest, res: Response) {
    const data = await projectService.create(req.user!, req.body);
    return sendCreated(res, data, 'Project created');
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const data = await projectService.update(req.user!, id, req.body);
    return sendSuccess(res, data, 'Project updated');
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await projectService.remove(req.user!, id);
    return sendSuccess(res, null, 'Project deleted');
  }
}

export const projectController = new ProjectController();
