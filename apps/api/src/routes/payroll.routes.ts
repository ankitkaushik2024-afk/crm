import { Router } from 'express';
import { PERMISSIONS } from '@crm/shared';
import { authenticate } from '../middleware/auth.middleware';
import { requireAnyPermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import { payrollController } from '../controllers/payroll.controller';
import { listPayrollSchema, upsertSalaryStructureSchema } from '../validators/payroll.validator';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  requireAnyPermission(PERMISSIONS.PAYROLL_READ),
  validate(listPayrollSchema, 'query'),
  (req, res, next) => payrollController.list(req, res).catch(next)
);

router.get(
  '/salary-structures',
  requireAnyPermission(PERMISSIONS.PAYROLL_READ),
  (req, res, next) => payrollController.listSalaryStructures(req, res).catch(next)
);

router.post(
  '/salary-structures',
  requireAnyPermission(PERMISSIONS.PAYROLL_WRITE),
  validate(upsertSalaryStructureSchema),
  (req, res, next) => payrollController.upsertSalaryStructure(req, res).catch(next)
);

export default router;
