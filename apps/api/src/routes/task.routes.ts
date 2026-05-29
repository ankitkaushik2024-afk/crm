import { Router } from 'express';
import { PERMISSIONS } from '@crm/shared';
import { authenticate } from '../middleware/auth.middleware';
import { requireAnyPermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { taskController } from '../controllers/task.controller';
import { createTaskSchema, listTasksSchema, updateTaskSchema } from '../validators/task.validator';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  requireAnyPermission(PERMISSIONS.TASKS_READ, PERMISSIONS.TASKS_WRITE),
  validate(listTasksSchema, 'query'),
  (req, res, next) => taskController.list(req, res).catch(next)
);

router.post(
  '/',
  requireAnyPermission(PERMISSIONS.TASKS_WRITE),
  validate(createTaskSchema),
  (req, res, next) => taskController.create(req, res).catch(next)
);

router.get(
  '/:id',
  requireAnyPermission(PERMISSIONS.TASKS_READ, PERMISSIONS.TASKS_WRITE),
  (req, res, next) => taskController.getById(req, res).catch(next)
);

router.patch(
  '/:id',
  requireAnyPermission(PERMISSIONS.TASKS_WRITE),
  validate(updateTaskSchema),
  (req, res, next) => taskController.update(req, res).catch(next)
);

export default router;
