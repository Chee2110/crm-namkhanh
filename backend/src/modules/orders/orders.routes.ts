import { Router } from 'express';
import { ordersController } from './orders.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';
import { dataScopeFilter } from '../../common/guards/data-scope.guard';

const router = Router();

router.use(authGuard);

router.get(
  '/',
  requirePermission('B_ORDERS', 'read'),
  dataScopeFilter('B_ORDERS'),
  ordersController.getOrders
);
router.get('/:id', requirePermission('B_ORDERS', 'read'), ordersController.getOrderById);
router.post('/', requirePermission('B_ORDERS', 'create'), ordersController.createOrder);
router.put('/:id', requirePermission('B_ORDERS', 'update'), ordersController.updateOrder);
router.post('/:id/handover', requirePermission('B_ORDERS', 'update'), ordersController.handoverOrder);
router.post('/:id/cancel-refund', requirePermission('B_ORDERS', 'update'), ordersController.cancelOrderWithRefund);
router.post('/:id/adjust-amount', requirePermission('B_ORDERS', 'update'), ordersController.adjustOrderAmount);
router.post('/:id/adjust', requirePermission('B_ORDERS', 'update'), ordersController.adjustOrderAmount);
router.post('/:id/returns', requirePermission('B_ORDERS', 'update'), ordersController.createOrderReturn);
router.get('/:id/returns', requirePermission('B_ORDERS', 'read'), ordersController.getOrderReturns);
router.delete('/:id', requirePermission('B_ORDERS', 'delete'), ordersController.deleteOrder);

export default router;
