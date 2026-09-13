import { Request, Response } from 'express';
import { salesOverviewService } from './sales-overview.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class SalesOverviewController {
  async getOverview(req: Request, res: Response) {
    try {
      const period = (req.query.period as 'year' | 'quarter' | 'month') || 'year';
      const result = await salesOverviewService.getSalesOverview(period);
      return successResponse(res, result, 'Lấy tổng quan kinh doanh thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy tổng quan kinh doanh', 400);
    }
  }
}

export const salesOverviewController = new SalesOverviewController();
