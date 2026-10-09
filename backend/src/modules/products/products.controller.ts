import { Request, Response } from 'express';
import { productsService } from './products.service';
import { successResponse, errorResponse } from '../../common/utils/response';

export class ProductsController {
  async getProducts(req: Request, res: Response) {
    try {
      const { category, categoryId, productTypeId, warehouseId, supplierId, search, status, lowStock } = req.query;
      const result = await productsService.getProducts({
        category: category as string,
        categoryId: categoryId as string,
        productTypeId: productTypeId as string,
        warehouseId: warehouseId as string,
        supplierId: supplierId as string,
        search: search as string,
        status: status as string,
        lowStock: lowStock === 'true'
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
      const {
        code,
        barcode,
        name,
        category,
        categoryId,
        categoryCode,
        categoryName,
        productTypeId,
        productTypeCode,
        productTypeName,
        warehouseId,
        warehouseCode,
        warehouseName,
        supplierId,
        supplierName,
        supplierPhone,
        supplierAddress,
        unit,
        costPrice,
        sellingPrice,
        vatRate,
        stockQuantity,
        minStockLevel,
        maxStockLevel,
        brand,
        specification,
        subTypeCode,
        subTypeName,
        imageUrl,
        color,
        length,
        width,
        height,
        weight,
        description,
        status
      } = req.body;

      if (!code || !name || !unit) {
        return errorResponse(res, 'Mã SKU, tên sản phẩm và đơn vị tính là bắt buộc', 400);
      }

      const result = await productsService.createProduct({
        code: String(code).trim().toUpperCase(),
        barcode: barcode ? String(barcode).trim() : undefined,
        name: String(name).trim(),
        category: category ? String(category).trim() : undefined,
        categoryId: categoryId ? String(categoryId).trim() : undefined,
        categoryCode: categoryCode ? String(categoryCode).trim() : undefined,
        categoryName: categoryName ? String(categoryName).trim() : undefined,
        productTypeId: productTypeId ? String(productTypeId).trim() : undefined,
        productTypeCode: productTypeCode ? String(productTypeCode).trim() : undefined,
        productTypeName: productTypeName ? String(productTypeName).trim() : undefined,
        warehouseId: warehouseId ? String(warehouseId).trim() : undefined,
        warehouseCode: warehouseCode ? String(warehouseCode).trim() : undefined,
        warehouseName: warehouseName ? String(warehouseName).trim() : undefined,
        supplierId: supplierId ? String(supplierId).trim() : undefined,
        supplierName: supplierName ? String(supplierName).trim() : undefined,
        supplierPhone: supplierPhone ? String(supplierPhone).trim() : undefined,
        supplierAddress: supplierAddress ? String(supplierAddress).trim() : undefined,
        unit: String(unit).trim(),
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        vatRate: vatRate !== undefined ? Number(vatRate) : 8,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 100,
        minStockLevel: minStockLevel !== undefined ? Number(minStockLevel) : 20,
        maxStockLevel: maxStockLevel !== undefined ? Number(maxStockLevel) : 1000,
        brand: brand ? String(brand).trim() : undefined,
        specification: specification ? String(specification).trim() : undefined,
        subTypeCode: subTypeCode ? String(subTypeCode).trim() : undefined,
        subTypeName: subTypeName ? String(subTypeName).trim() : undefined,
        imageUrl: imageUrl ? String(imageUrl).trim() : undefined,
        color: color ? String(color).trim() : undefined,
        length: length !== undefined && length !== '' && length !== null ? Number(length) : undefined,
        width: width !== undefined && width !== '' && width !== null ? Number(width) : undefined,
        height: height !== undefined && height !== '' && height !== null ? Number(height) : undefined,
        weight: weight !== undefined && weight !== '' && weight !== null ? Number(weight) : undefined,
        description: description ? String(description).trim() : undefined,
        status: status || 'ACTIVE'
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
      if (id) {
        const result = await productsService.updateProduct(id, { imageUrl });
        return successResponse(res, { ...result, imageUrl, url: imageUrl }, 'Tải lên hình ảnh sản phẩm thành công');
      }
      return successResponse(res, { imageUrl, url: imageUrl }, 'Tải lên hình ảnh sản phẩm thành công');
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi tải lên hình ảnh sản phẩm', 400);
    }
  }

  async proxyImage(req: Request, res: Response) {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') {
        return errorResponse(res, 'Vui lòng cung cấp URL hình ảnh', 400);
      }
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return errorResponse(res, 'URL hình ảnh không hợp lệ', 400);
      }
      const response = await fetch(url);
      if (!response.ok) {
        return errorResponse(res, 'Không thể tải hình ảnh từ nguồn', 400);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'image/png';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    } catch (error: any) {
      return errorResponse(res, error.message || 'Lỗi proxy hình ảnh', 500);
    }
  }
}

export const productsController = new ProductsController();
