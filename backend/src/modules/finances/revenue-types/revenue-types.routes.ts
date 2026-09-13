import { Router } from 'express';
import { revenueTypesController } from './revenue-types.controller';
import { authGuard } from '../../../common/guards/auth.guard';
import { requirePermission } from '../../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('E_REVENUE_TYPES', 'read'), revenueTypesController.getRevenueTypes);
router.get('/:id', requirePermission('E_REVENUE_TYPES', 'read'), revenueTypesController.getRevenueTypeById);
router.post('/', requirePermission('E_REVENUE_TYPES', 'create'), revenueTypesController.createRevenueType);
router.put('/:id', requirePermission('E_REVENUE_TYPES', 'update'), revenueTypesController.updateRevenueType);
router.delete('/:id', requirePermission('E_REVENUE_TYPES', 'delete'), revenueTypesController.deleteRevenueType);

export default router;
