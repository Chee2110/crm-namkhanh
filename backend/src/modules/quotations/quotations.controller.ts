import { Request, Response } from 'express';
import { quotationsService } from './quotations.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class QuotationsController {
  async getQuotations(req: Request, res: Response) {
    try {
      const { customerId, managerId, status, search } = req.query;
      const user = (req as any).user;
      const dataScope = (req as any).dataScope || 'ALL';

      const result = await quotationsService.getQuotations({
        customerId: customerId as string,
        managerId: managerId as string,
        status: status as string,
        search: search as string,
        dataScope,
        currentUserId: user?.id,
        departmentId: user?.departmentId
      });

      return successResponse(res, result, 'Lấy danh sách báo giá thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách báo giá', 400);
    }
  }

  async getQuotationById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await quotationsService.getQuotationById(id);
      return successResponse(res, result, 'Lấy chi tiết báo giá thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết báo giá', 400);
    }
  }

  async createQuotation(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const { customerId, date, validUntil, status, notes, vatRate, items } = req.body;

      if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
        return errorResponse(res, 'Vui lòng chọn khách hàng và ít nhất 1 sản phẩm', 400);
      }

      const result = await quotationsService.createQuotation(
        {
          customerId,
          date,
          validUntil,
          status,
          notes,
          vatRate,
          items
        },
        user?.id
      );

      return successResponse(res, result, 'Tạo báo giá mới thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo báo giá', 400);
    }
  }

  async updateQuotation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await quotationsService.updateQuotation(id, req.body);
      return successResponse(res, result, 'Cập nhật báo giá thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật báo giá', 400);
    }
  }

  async convertToOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const result = await quotationsService.convertToOrder(id, user?.id);
      return successResponse(res, result, 'Chuyển Báo giá thành Đơn hàng thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi chuyển đổi báo giá thành đơn hàng', 400);
    }
  }

  async deleteQuotation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await quotationsService.deleteQuotation(id);
      return successResponse(res, result, 'Xóa báo giá thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa báo giá', 400);
    }
  }
}

export const quotationsController = new QuotationsController();
