import { Router } from 'express';
import { categoriesController } from './categories.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { requirePermission } from '../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

router.get('/', requirePermission('C_CATEGORIES', 'read'), categoriesController.getCategories);
router.get('/:id', requirePermission('C_CATEGORIES', 'read'), categoriesController.getCategoryById);
router.post('/', requirePermission('C_CATEGORIES', 'create'), categoriesController.createCategory);
router.put('/:id', requirePermission('C_CATEGORIES', 'update'), categoriesController.updateCategory);
router.delete('/:id', requirePermission('C_CATEGORIES', 'delete'), categoriesController.deleteCategory);

export default router;
