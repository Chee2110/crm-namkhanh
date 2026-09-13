import { Router } from 'express';
import { expenseCategoriesController } from './expense-categories.controller';
import { authGuard } from '../../../common/guards/auth.guard';
import { requirePermission } from '../../../common/guards/rbac.guard';

const router = Router();

router.use(authGuard);

// Categories
router.get('/', requirePermission('E_EXPENSES', 'read'), expenseCategoriesController.getCategories);
router.get('/types', requirePermission('E_EXPENSES', 'read'), expenseCategoriesController.getTypes);
router.get('/:id', requirePermission('E_EXPENSES', 'read'), expenseCategoriesController.getCategoryById);
router.post('/', requirePermission('E_EXPENSES', 'create'), expenseCategoriesController.createCategory);
router.put('/:id', requirePermission('E_EXPENSES', 'update'), expenseCategoriesController.updateCategory);
router.delete('/:id', requirePermission('E_EXPENSES', 'delete'), expenseCategoriesController.deleteCategory);

// Types
router.post('/types', requirePermission('E_EXPENSES', 'create'), expenseCategoriesController.createType);
router.put('/types/:id', requirePermission('E_EXPENSES', 'update'), expenseCategoriesController.updateType);
router.delete('/types/:id', requirePermission('E_EXPENSES', 'delete'), expenseCategoriesController.deleteType);

export default router;
