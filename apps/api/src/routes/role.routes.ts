import { Router } from 'express';
import { roleController } from '../controllers/role.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { ROLES } from '@crm/shared';

const router = Router();

router.use(authenticate);
router.use(requireRoles(ROLES.SUPER_ADMIN));

router.get('/', (req, res, next) => roleController.list(req, res).catch(next));
router.get('/permissions', (req, res, next) =>
  roleController.listPermissions(req, res).catch(next)
);
router.get('/:id', (req, res, next) => roleController.getById(req, res).catch(next));

export default router;
