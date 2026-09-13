import { Request, Response } from 'express';
import { productsService } from './products.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class ProductsController {
  async getProducts(req: Request, res: Response) {
    try {
      const { category, search, status } = req.query;
      const result = await productsService.getProducts({
        category: category as string,
        search: search as string,
        status: status as string
      });
      return successResponse(res, result, 'Lấy danh sách sản phẩm thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy danh sách sản phẩm', 400);
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productsService.getProductById(id);
      return successResponse(res, result, 'Lấy chi tiết sản phẩm thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi lấy chi tiết sản phẩm', 400);
    }
  }

  async createProduct(req: Request, res: Response) {
    try {
      const { code, name, category, unit, costPrice, sellingPrice, vatRate, stockQuantity, description, status } = req.body;
      if (!code || !name || !category || !unit) {
        return errorResponse(res, 'Mã, tên, danh mục và đơn vị tính là bắt buộc', 400);
      }
      const result = await productsService.createProduct({
        code,
        name,
        category,
        unit,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        vatRate: vatRate !== undefined ? Number(vatRate) : 8,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 100,
        description,
        status
      });
      return successResponse(res, result, 'Tạo sản phẩm thành công', 201);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tạo sản phẩm', 400);
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productsService.updateProduct(id, req.body);
      return successResponse(res, result, 'Cập nhật sản phẩm thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi cập nhật sản phẩm', 400);
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await productsService.deleteProduct(id);
      return successResponse(res, result, 'Xóa sản phẩm thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi xóa sản phẩm', 400);
    }
  }

  async uploadImage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      if (!req.file) {
        return errorResponse(res, 'Vui lòng chọn file hình ảnh sản phẩm', 400);
      }
      const imageUrl = `/uploads/${req.file.filename}`;
      const result = await productsService.updateProduct(id, { imageUrl });
      return successResponse(res, result, 'Tải lên hình ảnh sản phẩm thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tải lên hình ảnh sản phẩm', 400);
    }
  }
}

export const productsController = new ProductsController();
