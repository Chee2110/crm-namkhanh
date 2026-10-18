import { Router, Request, Response, NextFunction } from 'express';
import { productGroupsController } from './product-groups.controller';
import { authGuard } from '../../common/guards/auth.guard';
import { PermissionAction } from '../../common/guards/rbac.guard';
import { errorResponse } from '../../common/utils/response';

const checkGroupPermission = (action: PermissionAction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return errorResponse(res, 'Yêu cầu đăng nhập', 401);
    if (user.roles.includes('ADMIN') || user.roles.includes('CEO')) return next();

    const allowedModules = ['C_PRODUCT_TYPES', 'C_PRODUCTS', 'C_PRODUCT_GROUPS'];
    const hasPerm = user.permissions.some((p) => {
      if (!allowedModules.includes(p.moduleCode)) return false;
      switch (action) {
        case 'read': return p.canRead;
        case 'create': return p.canCreate;
        case 'update': return p.canUpdate;
        case 'delete': return p.canDelete;
        default: return false;
      }
    });

    if (!hasPerm) {
      return errorResponse(res, `Bạn không có quyền thực hiện hành động [${action.toUpperCase()}] trên nhóm hàng`, 403);
    }
    next();
  };
};

const router = Router();

router.use(authGuard);

router.get('/', checkGroupPermission('read'), productGroupsController.getProductGroups);
router.get('/:id', checkGroupPermission('read'), productGroupsController.getProductGroupById);
router.post('/', checkGroupPermission('create'), productGroupsController.createProductGroup);
router.put('/:id', checkGroupPermission('update'), productGroupsController.updateProductGroup);
router.delete('/:id', checkGroupPermission('delete'), productGroupsController.deleteProductGroup);

export default router;
