import { Request, Response } from 'express';
import { productGroupsService } from './product-groups.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class ProductGroupsController {
  async getProductGroups(req: Request, res: Response) {
    try {
      const { categoryId, productTypeId, search } = req.query;
      const result = await productGroupsService.getProductGroups({
        categoryId: categoryId as string,
        productTypeId: productTypeId as string,
        search: search as string
      });
      return successResponse(res, result, 'Lấy danh sách nhóm loại hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách nhóm loại hàng', 400);
    }
  }

  async getProductGroupById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productGroupsService.getProductGroupById(id);
      return successResponse(res, result, 'Lấy chi tiết nhóm loại hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy thông tin nhóm loại hàng', 400);
    }
  }

  async createProductGroup(req: Request, res: Response) {
    try {
      const { code, name, productTypeId, description } = req.body;
      if (!name || !String(name).trim()) {
        return errorResponse(res, 'Tên nhóm loại hàng hóa là bắt buộc', 400);
      }
      const result = await productGroupsService.createProductGroup({
        code,
        name,
        productTypeId,
        description
      });
      return successResponse(res, result, 'Tạo nhóm loại hàng hóa mới thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo nhóm loại hàng', 400);
    }
  }

  async updateProductGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productGroupsService.updateProductGroup(id, req.body);
      return successResponse(res, result, 'Cập nhật nhóm loại hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật nhóm loại hàng', 400);
    }
  }

  async deleteProductGroup(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productGroupsService.deleteProductGroup(id);
      return successResponse(res, result, 'Xóa nhóm loại hàng thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa nhóm loại hàng', 400);
    }
  }
}

export const productGroupsController = new ProductGroupsController();
