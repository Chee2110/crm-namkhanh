import { Router } from 'express';
import { salesPlansController } from './sales-plans.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get(
  '/',
  requirePermission('B_SALES_PLANS', 'read'),
  salesPlansController.getSalesPlans
);
router.get('/:id', requirePermission('B_SALES_PLANS', 'read'), salesPlansController.getSalesPlanById);
router.get('/:id/compare', requirePermission('B_SALES_PLANS', 'read'), salesPlansController.comparePlan);
router.post('/', requirePermission('B_SALES_PLANS', 'create'), salesPlansController.createSalesPlan);
router.put('/:id', requirePermission('B_SALES_PLANS', 'update'), salesPlansController.updateSalesPlan);
router.delete('/:id', requirePermission('B_SALES_PLANS', 'delete'), salesPlansController.deleteSalesPlan);

export default router;
