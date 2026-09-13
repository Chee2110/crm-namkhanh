import { Router } from 'express';
import { cashflowReportsController } from './cashflow-reports.controller';
import { authGuard } from '../../../common/guards/auth.guard';
import { requirePermission } from '../../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/summary', requirePermission('E_CASHFLOW_REPORTS', 'read'), cashflowReportsController.getCashflowSummary);

export default router;
