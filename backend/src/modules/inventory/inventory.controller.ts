import { Request, Response } from 'express';
import { inventoryService } from './inventory.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class InventoryController {
  async getOverview(req: Request, res: Response) {
    try {
      const result = await inventoryService.getInventoryOverview();
      return successResponse(res, result, 'Lấy tổng quan kho thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy tổng quan kho', 400);
    }
  }

  async getReports(req: Request, res: Response) {
    try {
      const { view } = req.query;
      const result = await inventoryService.getInventoryReport((view as any) || 'category');
      return successResponse(res, result, 'Lấy báo cáo tồn kho thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy báo cáo tồn kho', 400);
    }
  }
}

export const inventoryController = new InventoryController();
