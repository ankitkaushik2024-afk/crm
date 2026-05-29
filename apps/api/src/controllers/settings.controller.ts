import { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendSuccess } from '../utils/response';
import { settingsService } from '../services/settings.service';

export class SettingsController {
  async get(req: AuthenticatedRequest, res: Response) {
    const data = await settingsService.get(req.user!.companyId);
    return sendSuccess(res, data);
  }

  async update(req: AuthenticatedRequest, res: Response) {
    const data = await settingsService.update(req.user!.companyId, req.body);
    return sendSuccess(res, data, 'Settings updated');
  }
}

export const settingsController = new SettingsController();
