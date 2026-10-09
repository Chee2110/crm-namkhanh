import { Request, Response } from 'express';
import { systemService } from './system.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class SystemController {
  /**
   * Lấy trạng thái Chế độ Bảo trì (Public)
   */
  async getMaintenanceStatus(req: Request, res: Response) {
    try {
      const state = await systemService.getMaintenanceState();
      return successResponse(res, state, 'Lấy trạng thái hệ thống thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi kiểm tra bảo trì', 500);
    }
  }

  /**
   * Bật / Tắt chế độ bảo trì (Chỉ ADMIN)
   */
  async toggleMaintenance(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user || !user.roles.includes('ADMIN')) {
        return errorResponse(res, 'Chỉ Quản trị viên (ADMIN) mới có quyền điều khiển chế độ bảo trì', 403);
      }

      const { enable } = req.body;
      const state = await systemService.setMaintenance(
        Boolean(enable),
        user.id,
        user.fullName || user.email
      );

      const message = enable
        ? 'Đã kích hoạt Chế độ Bảo trì hệ thống. Tất cả các tài khoản nhân viên đã được đăng xuất an toàn.'
        : 'Đã hoàn tất bảo trì và mở lại hệ thống cho người dùng.';

      return successResponse(res, state, message);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi thao tác bảo trì', 500);
    }
  }

  /**
   * Heartbeat kiểm tra tính hợp lệ của phiên làm việc & chế độ bảo trì thời gian thực
   */
  async checkSession(req: Request, res: Response) {
    try {
      const user = req.user;
      if (!user) {
        return errorResponse(res, 'Chưa xác thực', 401);
      }

      const maintenance = await systemService.getMaintenanceState();
      if (maintenance.isMaintenance && !user.roles.includes('ADMIN')) {
        return res.status(401).json({
          success: false,
          code: 'SYSTEM_MAINTENANCE',
          message: 'Hệ thống đang bảo trì định kỳ. Phiên làm việc tạm thời bị đăng xuất.',
          data: maintenance
        });
      }

      return successResponse(
        res,
        {
          active: true,
          userId: user.id,
          maintenance
        },
        'Phiên làm việc hợp lệ'
      );
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi kiểm tra phiên', 500);
    }
  }
}

export const systemController = new SystemController();
