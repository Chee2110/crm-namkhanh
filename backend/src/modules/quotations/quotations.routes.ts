import { Router } from 'express';
import { quotationsController } from './quotations.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';
import { dataScopeFilter } from '../../common/guards/data-scope.guard';

const router = Router();

router.use(authGuard);

router.get(
  '/',
  requirePermission('B_QUOTATIONS', 'read'),
  dataScopeFilter('B_QUOTATIONS'),
  quotationsController.getQuotations
);
router.get('/:id', requirePermission('B_QUOTATIONS', 'read'), quotationsController.getQuotationById);
router.post('/', requirePermission('B_QUOTATIONS', 'create'), quotationsController.createQuotation);
router.put('/:id', requirePermission('B_QUOTATIONS', 'update'), quotationsController.updateQuotation);
router.post('/:id/convert-to-order', requirePermission('B_ORDERS', 'create'), quotationsController.convertToOrder);
router.delete('/:id', requirePermission('B_QUOTATIONS', 'delete'), quotationsController.deleteQuotation);

export default router;
