import { Request, Response } from 'express';
import { revenueTypesService } from './revenue-types.service';
import { successResponse, errorResponse } from '../../../common/utils/response';

export class RevenueTypesController {
  async getRevenueTypes(req: Request, res: Response) {
    try {
      const data = await revenueTypesService.getRevenueTypes();
      return successResponse(res, data, 'Lấy danh mục nhóm khoản thu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy nhóm khoản thu', 400);
    }
  }

  async getRevenueTypeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await revenueTypesService.getRevenueTypeById(id);
      return successResponse(res, data, 'Lấy chi tiết nhóm khoản thu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết nhóm khoản thu', 400);
    }
  }

  async createRevenueType(req: Request, res: Response) {
    try {
      const { code, name, description, status } = req.body;
      if (!code || !name) {
        return errorResponse(res, 'Mã và tên nhóm khoản thu là bắt buộc', 400);
      }
      const data = await revenueTypesService.createRevenueType({ code, name, description, status });
      return successResponse(res, data, 'Tạo nhóm khoản thu thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo nhóm khoản thu', 400);
    }
  }

  async updateRevenueType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await revenueTypesService.updateRevenueType(id, req.body);
      return successResponse(res, data, 'Cập nhật nhóm khoản thu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật nhóm khoản thu', 400);
    }
  }

  async deleteRevenueType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await revenueTypesService.deleteRevenueType(id);
      return successResponse(res, null, 'Xóa nhóm khoản thu thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa nhóm khoản thu', 400);
    }
  }
}

export const revenueTypesController = new RevenueTypesController();
