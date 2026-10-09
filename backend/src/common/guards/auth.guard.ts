import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/db';
import { errorResponse } from '../utils/response';
import { systemService } from '../../modules/system/system.service';

export interface AuthenticatedUser {
  id: string;
  code: string;
  fullName: string;
  email: string;
  departmentId?: string | null;
  roles: string[];
  permissions: {
    moduleCode: string;
    canRead: boolean;
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    dataScope: string;
  }[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authGuard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Chưa đăng nhập hoặc thiếu token xác thực', 401);
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'crm_namkhanh_super_secret_jwt_key_2026';

    const decoded = jwt.verify(token, secret) as { userId: string; sessionId?: string };
    if (!decoded || !decoded.userId) {
      return errorResponse(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                permissions: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return errorResponse(res, 'Tài khoản không tồn tại trên hệ thống', 401);
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 'Tài khoản đã bị tạm khóa hoặc ngừng hoạt động', 403);
    }

    const roles = user.userRoles.map((ur: any) => ur.role.code);

    // 1. Kiểm tra Chế độ Bảo trì: Nếu đang bật bảo trì và người dùng không phải ADMIN -> Đăng xuất ngay
    const maintenance = await systemService.getMaintenanceState();
    if (maintenance.isMaintenance && !roles.includes('ADMIN')) {
      return res.status(401).json({
        success: false,
        code: 'SYSTEM_MAINTENANCE',
        message: 'Hệ thống hiện đang ở Chế độ Bảo trì định kỳ. Toàn bộ phiên làm việc của nhân viên tạm thời bị đăng xuất.',
        data: maintenance
      });
    }

    // 2. Kiểm tra Đơn thiết bị: Nếu token có sessionId, kiểm tra xem phiên có bị đăng nhập đè từ thiết bị khác không
    if (decoded.sessionId) {
      const isSessionActive = await systemService.isSessionActive(user.id, decoded.sessionId);
      if (!isSessionActive) {
        const revocation = await systemService.getRevocationInfo(decoded.sessionId, user.id);
        return res.status(401).json({
          success: false,
          code: 'CONCURRENT_LOGIN_KICK',
          message: 'Tài khoản của bạn đã được đăng nhập từ một thiết bị khác.',
          data: revocation ? {
            newDevice: revocation.newDevice || 'Thiết bị khác',
            newIp: revocation.newIp || 'Địa chỉ IP mới',
            loginAt: revocation.loginAt || new Date().toISOString()
          } : null
        });
      }
    }

    // Hợp nhất ma trận phân quyền từ các roles của user (nếu có nhiều roles)
    const permissionMap = new Map<string, {
      moduleCode: string;
      canRead: boolean;
      canCreate: boolean;
      canUpdate: boolean;
      canDelete: boolean;
      dataScope: string;
    }>();

    for (const ur of user.userRoles as any[]) {
      for (const p of ur.role.permissions) {
        const existing = permissionMap.get(p.moduleCode);
        if (!existing) {
          permissionMap.set(p.moduleCode, {
            moduleCode: p.moduleCode,
            canRead: p.canRead,
            canCreate: p.canCreate,
            canUpdate: p.canUpdate,
            canDelete: p.canDelete,
            dataScope: p.dataScope
          });
        } else {
          // Gộp quyền theo nguyên tắc mở rộng nhất
          existing.canRead = existing.canRead || p.canRead;
          existing.canCreate = existing.canCreate || p.canCreate;
          existing.canUpdate = existing.canUpdate || p.canUpdate;
          existing.canDelete = existing.canDelete || p.canDelete;
          // Scope: ALL > DEPARTMENT > PERSONAL
          if (p.dataScope === 'ALL' || existing.dataScope === 'ALL') {
            existing.dataScope = 'ALL';
          } else if (p.dataScope === 'DEPARTMENT' || existing.dataScope === 'DEPARTMENT') {
            existing.dataScope = 'DEPARTMENT';
          }
        }
      }
    }

    req.user = {
      id: user.id,
      code: user.code,
      fullName: user.fullName,
      email: user.email,
      departmentId: user.departmentId,
      roles,
      permissions: Array.from(permissionMap.values())
    };

    next();
  } catch (error) {
    return errorResponse(res, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại', 401);
  }
};
