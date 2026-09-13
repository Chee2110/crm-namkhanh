import { Request, Response } from 'express';
import { salesPlansService } from './sales-plans.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class SalesPlansController {
  async getSalesPlans(req: Request, res: Response) {
    try {
      const { year, periodType } = req.query;
      const result = await salesPlansService.getSalesPlans({
        year: year ? Number(year) : undefined,
        periodType: periodType as string
      });
      return successResponse(res, result, 'Lấy danh sách kế hoạch kinh doanh thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách kế hoạch', 400);
    }
  }

  async getSalesPlanById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await salesPlansService.getSalesPlanById(id);
      return successResponse(res, result, 'Lấy chi tiết kế hoạch thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết kế hoạch', 400);
    }
  }

  async createSalesPlan(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { title, periodType, periodValue, year, departmentId, notes, items } = req.body;

      if (!title || !periodValue || !items || !Array.isArray(items) || items.length === 0) {
        return errorResponse(res, 'Tiêu đề, kỳ kế hoạch và chỉ tiêu hàng hóa là bắt buộc', 400);
      }

      const result = await salesPlansService.createSalesPlan(
        {
          title,
          periodType,
          periodValue,
          year: year ? Number(year) : undefined,
          departmentId,
          notes,
          items
        },
        user?.id
      );

      return successResponse(res, result, 'Tạo kế hoạch kinh doanh thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo kế hoạch kinh doanh', 400);
    }
  }

  async updateSalesPlan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await salesPlansService.updateSalesPlan(id, req.body);
      return successResponse(res, result, 'Cập nhật kế hoạch thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật kế hoạch', 400);
    }
  }

  async comparePlan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await salesPlansService.comparePlan(id);
      return successResponse(res, result, 'Đối chiếu kế hoạch vs thực tế thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi đối chiếu kế hoạch', 400);
    }
  }

  async deleteSalesPlan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await salesPlansService.deleteSalesPlan(id);
      return successResponse(res, result, 'Xóa kế hoạch thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa kế hoạch', 400);
    }
  }
}

export const salesPlansController = new SalesPlansController();
