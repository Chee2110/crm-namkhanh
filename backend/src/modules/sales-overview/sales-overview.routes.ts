import { Router } from 'express';
import { salesOverviewController } from './sales-overview.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get(
  '/',
  requirePermission('B_SALES_OVERVIEW', 'read'),
  salesOverviewController.getOverview
);

export default router;
