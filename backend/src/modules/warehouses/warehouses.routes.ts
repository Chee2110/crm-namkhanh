import { Router } from 'express';
import { warehousesController } from './warehouses.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('C_WAREHOUSES', 'read'), warehousesController.getWarehouses);
router.get('/:id', requirePermission('C_WAREHOUSES', 'read'), warehousesController.getWarehouseById);
router.post('/', requirePermission('C_WAREHOUSES', 'create'), warehousesController.createWarehouse);
router.put('/:id', requirePermission('C_WAREHOUSES', 'update'), warehousesController.updateWarehouse);
router.delete('/:id', requirePermission('C_WAREHOUSES', 'delete'), warehousesController.deleteWarehouse);

export default router;
