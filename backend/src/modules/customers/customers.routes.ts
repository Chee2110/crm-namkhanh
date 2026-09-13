import { Router } from 'express';
import { customersController } from './customers.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';
import { dataScopeFilter } from '../../common/guards/data-scope.guard';

const router = Router();

router.use(authGuard);

router.get(
  '/',
  requirePermission('B_CUSTOMERS', 'read'),
  dataScopeFilter('B_CUSTOMERS'),
  customersController.getCustomers
);
router.get('/:id', requirePermission('B_CUSTOMERS', 'read'), customersController.getCustomerById);
router.get('/:id/timeline', requirePermission('B_CUSTOMERS', 'read'), customersController.getCustomerTimeline);
router.post('/', requirePermission('B_CUSTOMERS', 'create'), customersController.createCustomer);
router.put('/:id', requirePermission('B_CUSTOMERS', 'update'), customersController.updateCustomer);
router.delete('/:id', requirePermission('B_CUSTOMERS', 'delete'), customersController.deleteCustomer);
router.post('/:id/handover', requirePermission('B_CUSTOMERS', 'update'), customersController.handoverCustomer);

export default router;
