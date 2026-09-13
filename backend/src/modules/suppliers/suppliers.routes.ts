import { Router } from 'express';
import { suppliersController } from './suppliers.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('C_SUPPLIERS', 'read'), suppliersController.getSuppliers);
router.get('/:id', requirePermission('C_SUPPLIERS', 'read'), suppliersController.getSupplierById);
router.get('/:id/products', requirePermission('C_SUPPLIERS', 'read'), suppliersController.getSupplierProducts);
router.post('/', requirePermission('C_SUPPLIERS', 'create'), suppliersController.createSupplier);
router.put('/:id', requirePermission('C_SUPPLIERS', 'update'), suppliersController.updateSupplier);
router.delete('/:id', requirePermission('C_SUPPLIERS', 'delete'), suppliersController.deleteSupplier);

export default router;
