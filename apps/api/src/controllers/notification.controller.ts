import { Response } from 'express';
import { notificationService } from '../services/notification.service';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import { sendSuccess, sendPaginated } from '../utils/response';

export class NotificationController {
  async list(req: AuthenticatedRequest, res: Response) {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await notificationService.getNotifications(req.user!.id, page, limit);
    
    const paginationMeta = {
      page: result.pagination.page,
      limit: result.pagination.limit,
      total: result.pagination.total,
      totalPages: result.pagination.pages,
    };

    return sendPaginated(res, result.notifications, paginationMeta);
  }

  async unread(req: AuthenticatedRequest, res: Response) {
    const limit = Number(req.query.limit) || 10;
    const notifications = await notificationService.getUnreadNotifications(req.user!.id, limit);
    return sendSuccess(res, notifications);
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    const id = req.params.id as string;
    const notification = await notificationService.markAsRead(id);
    return sendSuccess(res, notification);
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    await notificationService.markAllAsRead(req.user!.id);
    return sendSuccess(res, { success: true });
  }

  async delete(req: AuthenticatedRequest, res: Response) {
    const id = req.params.id as string;
    await notificationService.deleteNotification(id);
    return sendSuccess(res, { success: true });
  }
}

export const notificationController = new NotificationController();
