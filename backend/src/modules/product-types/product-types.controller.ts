import { Request, Response } from 'express';
import { productTypesService } from './product-types.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class ProductTypesController {
  async getProductTypes(req: Request, res: Response) {
    try {
      const { categoryId, search } = req.query;
      const result = await productTypesService.getProductTypes(categoryId as string, search as string);
      return successResponse(res, result, 'Lấy danh sách loại hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy loại hàng', 400);
    }
  }

  async getProductTypeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productTypesService.getProductTypeById(id);
      return successResponse(res, result, 'Lấy chi tiết loại hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy thông tin loại hàng', 400);
    }
  }

  async createProductType(req: Request, res: Response) {
    try {
      const { code, name, categoryId, unit, description } = req.body;
      if (!code || !name || !categoryId) {
        return errorResponse(res, 'Mã, Tên loại hàng và Danh mục cha là bắt buộc', 400);
      }
      const result = await productTypesService.createProductType({ code, name, categoryId, unit, description });
      return successResponse(res, result, 'Tạo loại hàng hóa mới thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo loại hàng', 400);
    }
  }

  async updateProductType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productTypesService.updateProductType(id, req.body);
      return successResponse(res, result, 'Cập nhật loại hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật loại hàng', 400);
    }
  }

  async deleteProductType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productTypesService.deleteProductType(id);
      return successResponse(res, result, 'Xóa loại hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa loại hàng', 400);
    }
  }
}

export const productTypesController = new ProductTypesController();
