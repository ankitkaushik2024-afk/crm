import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { notificationController } from '../controllers/notification.controller';

const router = Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/notifications
 * List user's notifications (paginated)
 */
router.get('/', (req, res, next) => notificationController.list(req, res).catch(next));

/**
 * GET /api/v1/notifications/unread
 * Get unread notifications listing
 */
router.get('/unread', (req, res, next) => notificationController.unread(req, res).catch(next));

/**
 * POST /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.post('/:id/read', (req, res, next) => notificationController.markAsRead(req, res).catch(next));

/**
 * POST /api/v1/notifications/mark-all-read
 * Mark all user's notifications as read
 */
router.post('/mark-all-read', (req, res, next) => notificationController.markAllAsRead(req, res).catch(next));

/**
 * DELETE /api/v1/notifications/:id
 * Delete a notification
 */
router.delete('/:id', (req, res, next) => notificationController.delete(req, res).catch(next));

export default router;
