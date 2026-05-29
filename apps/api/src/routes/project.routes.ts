import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { requireAnyPermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { PERMISSIONS } from '@crm/shared';
import { projectController } from '../controllers/project.controller';
import {
  createProjectSchema,
  listProjectsSchema,
  updateProjectSchema,
} from '../validators/project.validator';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  requireAnyPermission(PERMISSIONS.PROJECTS_READ),
  validate(listProjectsSchema, 'query'),
  (req, res, next) => projectController.list(req, res).catch(next)
);

router.post(
  '/',
  requireAnyPermission(PERMISSIONS.PROJECTS_WRITE),
  validate(createProjectSchema),
  (req, res, next) => projectController.create(req, res).catch(next)
);

router.get(
  '/:id',
  requireAnyPermission(PERMISSIONS.PROJECTS_READ),
  (req, res, next) => projectController.getById(req, res).catch(next)
);

router.patch(
  '/:id',
  requireAnyPermission(PERMISSIONS.PROJECTS_WRITE),
  validate(updateProjectSchema),
  (req, res, next) => projectController.update(req, res).catch(next)
);

router.delete(
  '/:id',
  requireAnyPermission(PERMISSIONS.PROJECTS_WRITE),
  (req, res, next) => projectController.remove(req, res).catch(next)
);

export default router;
