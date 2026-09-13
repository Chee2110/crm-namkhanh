import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export type PermissionAction = 'read' | 'create' | 'update' | 'delete';

export const requirePermission = (moduleCode: string, action: PermissionAction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return errorResponse(res, 'Yêu cầu đăng nhập', 401);
    }

    // ADMIN và CEO có toàn quyền mọi phân hệ
    if (user.roles.includes('ADMIN') || user.roles.includes('CEO')) {
      return next();
    }

    const perm = user.permissions.find((p) => p.moduleCode === moduleCode);
    if (!perm) {
      return errorResponse(res, `Bạn không có quyền truy cập phân hệ: ${moduleCode}`, 403);
    }

    let hasPermission = false;
    switch (action) {
      case 'read':
        hasPermission = perm.canRead;
        break;
      case 'create':
        hasPermission = perm.canCreate;
        break;
      case 'update':
        hasPermission = perm.canUpdate;
        break;
      case 'delete':
        hasPermission = perm.canDelete;
        break;
    }

    if (!hasPermission) {
      return errorResponse(
        res,
        `Bạn không có quyền thực hiện hành động [${action.toUpperCase()}] trên phân hệ: ${moduleCode}`,
        403
      );
    }

    next();
  };
};

export const requireRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return errorResponse(res, 'Yêu cầu đăng nhập', 401);
    }

    if (user.roles.includes('ADMIN')) {
      return next();
    }

    const hasRole = roles.some((r) => user.roles.includes(r));
    if (!hasRole) {
      return errorResponse(res, 'Bạn không thuộc vai trò được phép truy cập chức năng này', 403);
    }

    next();
  };
};
