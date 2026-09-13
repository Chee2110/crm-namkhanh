import { Router } from 'express';
import { productTypesController } from './product-types.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('C_PRODUCT_TYPES', 'read'), productTypesController.getProductTypes);
router.get('/:id', requirePermission('C_PRODUCT_TYPES', 'read'), productTypesController.getProductTypeById);
router.post('/', requirePermission('C_PRODUCT_TYPES', 'create'), productTypesController.createProductType);
router.put('/:id', requirePermission('C_PRODUCT_TYPES', 'update'), productTypesController.updateProductType);
router.delete('/:id', requirePermission('C_PRODUCT_TYPES', 'delete'), productTypesController.deleteProductType);

export default router;
