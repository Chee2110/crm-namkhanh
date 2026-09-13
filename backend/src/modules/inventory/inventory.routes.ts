import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/overview', requirePermission('C_OVERVIEW', 'read'), inventoryController.getOverview);
router.get('/reports', requirePermission('C_REPORTS', 'read'), inventoryController.getReports);

export default router;
