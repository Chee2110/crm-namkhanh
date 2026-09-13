import { Request, Response } from 'express';
import { expenseCategoriesService } from './expense-categories.service';
import { successResponse, errorResponse } from '../../../common/utils/response';

export class ExpenseCategoriesController {
  // Categories
  async getCategories(req: Request, res: Response) {
    try {
      const data = await expenseCategoriesService.getCategories();
      return successResponse(res, data, 'Lấy danh mục chi phí thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh mục chi phí', 400);
    }
  }

  async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await expenseCategoriesService.getCategoryById(id);
      return successResponse(res, data, 'Lấy chi tiết danh mục chi phí thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết danh mục chi phí', 400);
    }
  }

  async createCategory(req: Request, res: Response) {
    try {
      const { code, name, description, status } = req.body;
      if (!code || !name) {
        return errorResponse(res, 'Mã và tên danh mục chi phí là bắt buộc', 400);
      }
      const data = await expenseCategoriesService.createCategory({ code, name, description, status });
      return successResponse(res, data, 'Tạo danh mục chi phí thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo danh mục chi phí', 400);
    }
  }

  async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await expenseCategoriesService.updateCategory(id, req.body);
      return successResponse(res, data, 'Cập nhật danh mục chi phí thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật danh mục chi phí', 400);
    }
  }

  async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await expenseCategoriesService.deleteCategory(id);
      return successResponse(res, null, 'Xóa danh mục chi phí thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa danh mục chi phí', 400);
    }
  }

  // Expense Types
  async getTypes(req: Request, res: Response) {
    try {
      const { categoryId } = req.query;
      const data = await expenseCategoriesService.getTypes(categoryId as string);
      return successResponse(res, data, 'Lấy loại chi phí thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy loại chi phí', 400);
    }
  }

  async createType(req: Request, res: Response) {
    try {
      const { code, name, categoryId, description, status } = req.body;
      if (!code || !name || !categoryId) {
        return errorResponse(res, 'Mã, tên loại chi phí và danh mục cha là bắt buộc', 400);
      }
      const data = await expenseCategoriesService.createType({ code, name, categoryId, description, status });
      return successResponse(res, data, 'Tạo loại chi phí thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo loại chi phí', 400);
    }
  }

  async updateType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = await expenseCategoriesService.updateType(id, req.body);
      return successResponse(res, data, 'Cập nhật loại chi phí thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật loại chi phí', 400);
    }
  }

  async deleteType(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await expenseCategoriesService.deleteType(id);
      return successResponse(res, null, 'Xóa loại chi phí thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa loại chi phí', 400);
    }
  }
}

export const expenseCategoriesController = new ExpenseCategoriesController();
