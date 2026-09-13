import { Request, Response } from 'express';
import { dashboardService } from './dashboard.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class DashboardController {
  async getExecutiveOverview(req: Request, res: Response) {
    try {
      const period = (req.query.period as 'all' | 'year' | 'month') || 'year';
      const refresh = req.query.refresh === 'true';

      const data = await dashboardService.getExecutiveOverview(period, refresh);
      return successResponse(res, data, 'Lấy dữ liệu tổng quan điều hành thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi khi tải dữ liệu tổng quan điều hành', 400);
    }
  }

  async getRevenueAndVolume(req: Request, res: Response) {
    try {
      const period = (req.query.period as 'all' | 'year' | 'month') || 'year';
      const refresh = req.query.refresh === 'true';

      const data = await dashboardService.getRevenueAndVolume(period, refresh);
      return successResponse(res, data, 'Lấy báo cáo Doanh thu & Sản lượng (F-D1) thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi khi tải báo cáo Doanh thu & Sản lượng', 400);
    }
  }

  async getProfitDashboard(req: Request, res: Response) {
    try {
      const period = (req.query.period as 'all' | 'year' | 'month') || 'year';
      const refresh = req.query.refresh === 'true';

      const data = await dashboardService.getProfitDashboard(period, refresh);
      return successResponse(res, data, 'Lấy báo cáo Lợi nhuận gộp (F-D2) thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi khi tải báo cáo Lợi nhuận gộp', 400);
    }
  }
}

export const dashboardController = new DashboardController();
