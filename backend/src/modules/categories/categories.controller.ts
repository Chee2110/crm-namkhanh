import { Request, Response } from 'express';
import { categoriesService } from './categories.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class CategoriesController {
  async getCategories(req: Request, res: Response) {
    try {
      const { warehouseId, search } = req.query;
      const result = await categoriesService.getCategories(warehouseId as string, search as string);
      return successResponse(res, result, 'Lấy danh mục thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh mục', 400);
    }
  }

  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await categoriesService.getCategoryById(id);
      return successResponse(res, result, 'Lấy chi tiết danh mục thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy thông tin danh mục', 400);
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const { code, name, warehouseId, description } = req.body;
      if (!code || !name) {
        return errorResponse(res, 'Mã danh mục và Tên danh mục là bắt buộc', 400);
      }
      const result = await categoriesService.createCategory({ code, name, warehouseId, description });
      return successResponse(res, result, 'Tạo danh mục mới thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo danh mục', 400);
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await categoriesService.updateCategory(id, req.body);
      return successResponse(res, result, 'Cập nhật danh mục thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật danh mục', 400);
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await categoriesService.deleteCategory(id);
      return successResponse(res, result, 'Xóa danh mục thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa danh mục', 400);
    }
  }
}

export const categoriesController = new CategoriesController();
