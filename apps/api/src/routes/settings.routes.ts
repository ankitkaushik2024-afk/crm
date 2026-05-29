import { Router } from 'express';
import { PERMISSIONS } from '@crm/shared';
import { authenticate } from '../middleware/auth.middleware';
import { requireAnyPermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { settingsController } from '../controllers/settings.controller';
import { updateCompanySettingsSchema } from '../validators/settings.validator';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requireAnyPermission(PERMISSIONS.SETTINGS_MANAGE),
  (req, res, next) => settingsController.get(req, res).catch(next)
);

router.patch(
  '/',
  requireAnyPermission(PERMISSIONS.SETTINGS_MANAGE),
  validate(updateCompanySettingsSchema),
  (req, res, next) => settingsController.update(req, res).catch(next)
);

export default router;
