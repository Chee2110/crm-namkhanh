import { Router } from 'express';
import { productsController } from './products.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';
import { imageUpload } from '../../common/utils/upload';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('C_PRODUCTS', 'read'), productsController.getProducts);
router.get('/:id', requirePermission('C_PRODUCTS', 'read'), productsController.getProductById);
router.post('/', requirePermission('C_PRODUCTS', 'create'), productsController.createProduct);
router.put('/:id', requirePermission('C_PRODUCTS', 'update'), productsController.updateProduct);
router.post('/:id/upload-image', requirePermission('C_PRODUCTS', 'update'), imageUpload.single('file'), productsController.uploadImage);
router.delete('/:id', requirePermission('C_PRODUCTS', 'delete'), productsController.deleteProduct);

export default router;

