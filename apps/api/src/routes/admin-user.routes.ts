import { Router } from 'express';
import { ROLES } from '@crm/shared';
import { authenticate } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { adminUserController } from '../controllers/admin-user.controller';
import { listAdminUsersSchema, updateAdminUserSchema } from '../validators/admin-user.validator';

const router = Router();
router.use(authenticate);
router.use(requireRoles(ROLES.SUPER_ADMIN));

router.get('/', validate(listAdminUsersSchema, 'query'), (req, res, next) =>
  adminUserController.list(req, res).catch(next)
);

router.patch('/:id', validate(updateAdminUserSchema), (req, res, next) =>
  adminUserController.update(req, res).catch(next)
);

export default router;
