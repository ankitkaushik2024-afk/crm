import { Response } from 'express';
import { roleService } from '../services/role.service';
import { sendSuccess } from '../utils/response';

export class RoleController {
  async list(req: import('express').Request, res: Response) {
    const roles = await roleService.listRoles();
    return sendSuccess(res, roles);
  }

  async getById(req: import('express').Request, res: Response) {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const role = await roleService.getRole(id);
    return sendSuccess(res, role);
  }

  async listPermissions(_req: import('express').Request, res: Response) {
    const permissions = await roleService.listPermissions();
    return sendSuccess(res, permissions);
  }
}

export const roleController = new RoleController();
