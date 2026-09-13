import { Request, Response } from 'express';
import { suppliersService } from './suppliers.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class SuppliersController {
  async getSuppliers(req: Request, res: Response) {
    try {
      const { search } = req.query;
      const result = await suppliersService.getSuppliers(search as string);
      return successResponse(res, result, 'Lấy danh sách nhà cung cấp thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy nhà cung cấp', 400);
    }
  }

  async getSupplierById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await suppliersService.getSupplierById(id);
      return successResponse(res, result, 'Lấy thông tin nhà cung cấp thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy thông tin nhà cung cấp', 400);
    }
  }

  async getSupplierProducts(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await suppliersService.getSupplierProducts(id);
      return successResponse(res, result, 'Lấy danh sách sản phẩm theo nhà cung cấp thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách sản phẩm', 400);
    }
  }

  async createSupplier(req: Request, res: Response) {
    try {
      const { code, name, phone, email, address, taxCode, contactPerson, notes } = req.body;
      if (!name) {
        return errorResponse(res, 'Tên nhà cung cấp là bắt buộc', 400);
      }
      const result = await suppliersService.createSupplier({ code, name, phone, email, address, taxCode, contactPerson, notes });
      return successResponse(res, result, 'Tạo nhà cung cấp mới thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo nhà cung cấp', 400);
    }
  }

  async updateSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await suppliersService.updateSupplier(id, req.body);
      return successResponse(res, result, 'Cập nhật nhà cung cấp thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật nhà cung cấp', 400);
    }
  }

  async deleteSupplier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await suppliersService.deleteSupplier(id);
      return successResponse(res, result, 'Xóa nhà cung cấp thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa nhà cung cấp', 400);
    }
  }
}

export const suppliersController = new SuppliersController();
