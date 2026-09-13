import { Router } from 'express';
import { salesReportsController } from './sales-reports.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get(
  '/revenue',
  requirePermission('B_REPORTS', 'read'),
  salesReportsController.getRevenueReport
);
router.get(
  '/debts',
  requirePermission('B_REPORTS', 'read'),
  salesReportsController.getDebtsReport
);

export default router;
