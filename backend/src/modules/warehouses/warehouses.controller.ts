import { Request, Response } from 'express';
import { warehousesService } from './warehouses.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class WarehousesController {
  async getWarehouses(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const result = await warehousesService.getWarehouses(search as string);
      return successResponse(res, result, 'Lấy danh sách kho thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách kho', 400);
    }
  }

  async getWarehouseById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await warehousesService.getWarehouseById(id);
      return successResponse(res, result, 'Lấy chi tiết kho thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy thông tin kho', 400);
    }
  }

  async createWarehouse(req: Request, res: Response) {
    try {
      const { code, name, address, phone, departmentId } = req.body;
      if (!code || !name) {
        return errorResponse(res, 'Mã kho và Tên kho là bắt buộc', 400);
      }
      const result = await warehousesService.createWarehouse({ code, name, address, phone, departmentId });
      return successResponse(res, result, 'Tạo kho vật lý mới thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo kho', 400);
    }
  }

  async updateWarehouse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await warehousesService.updateWarehouse(id, req.body);
      return successResponse(res, result, 'Cập nhật kho thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật kho', 400);
    }
  }

  async deleteWarehouse(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await warehousesService.deleteWarehouse(id);
      return successResponse(res, result, 'Xóa kho thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa kho', 400);
    }
  }
}

export const warehousesController = new WarehousesController();
