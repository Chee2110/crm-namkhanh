import { Request, Response } from 'express';
import { salesReportsService } from './sales-reports.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class SalesReportsController {
  async getRevenueReport(req: Request, res: Response) {
    try {
      const view = (req.query.view as 'category' | 'product' | 'manager') || 'category';
      const result = await salesReportsService.getRevenueReport(view);
      return successResponse(res, result, 'Lấy báo cáo doanh thu & sản lượng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy báo cáo doanh thu', 400);
    }
  }

  async getDebtsReport(req: Request, res: Response) {
    try {
      const search = req.query.search as string;
      const result = await salesReportsService.getDebtsReport(search);
      return successResponse(res, result, 'Lấy báo cáo công nợ khách hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy báo cáo công nợ', 400);
    }
  }
}

export const salesReportsController = new SalesReportsController();
