import { Request, Response } from 'express';
import { cashflowReportsService } from './cashflow-reports.service';
import { successResponse, errorResponse } from '../../../common/utils/response';

export class CashflowReportsController {
  async getCashflowSummary(req: Request, res: Response) {
    try {
      const { period } = req.query;
      const data = await cashflowReportsService.getCashflowSummary(
        (period as 'month' | 'quarter' | 'year' | 'all') || 'month'
      );
      return successResponse(res, data, 'Lấy báo cáo dòng tiền thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy báo cáo dòng tiền', 400);
    }
  }
}

export const cashflowReportsController = new CashflowReportsController();
