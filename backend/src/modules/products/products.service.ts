import { prisma } from '../../config/db';

export class ProductsService {
  async getProducts(params?: {
    category?: string;
    categoryId?: string;
    productTypeId?: string;
    warehouseId?: string;
    supplierId?: string;
    search?: string;
    status?: string;
    lowStock?: boolean;
  }) {
    const where: any = {};
    if (params?.category) where.category = params.category;
    if (params?.categoryId) where.categoryId = params.categoryId;
    if (params?.productTypeId) where.productTypeId = params.productTypeId;
    if (params?.warehouseId) where.warehouseId = params.warehouseId;
    if (params?.supplierId) where.supplierId = params.supplierId;
    if (params?.status) where.status = params.status;

    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
        { barcode: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        categoryRel: { select: { id: true, code: true, name: true } },
        productType: { select: { id: true, code: true, name: true, unit: true } },
        supplier: { select: { id: true, code: true, name: true, phone: true } }
      },
      orderBy: { code: 'asc' }
    });

    if (params?.lowStock) {
      return products.filter((p) => p.stockQuantity <= p.minStockLevel);
    }

    return products;
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        warehouse: true,
        categoryRel: true,
        productType: true,
        supplier: true
      }
    });
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    return product;
  }

  async createProduct(data: {
    code: string;
    barcode?: string;
    name: string;
    category?: string;
    categoryId?: string;
    productTypeId?: string;
    warehouseId?: string;
    supplierId?: string;
    supplierName?: string;
    supplierPhone?: string;
    supplierAddress?: string;
    unit: string;
    costPrice?: number;
    sellingPrice?: number;
    vatRate?: number;
    stockQuantity?: number;
    minStockLevel?: number;
    color?: string;
    length?: number;
    width?: number;
    height?: number;
    weight?: number;
    description?: string;
    status?: string;
  }) {
    const code = data.code.trim().toUpperCase();
    const existing = await prisma.product.findUnique({ where: { code } });
    if (existing) throw new Error(`Mã sản phẩm [${code}] đã tồn tại`);

    const cleanBarcode = data.barcode && data.barcode.trim() ? data.barcode.trim() : null;
    if (cleanBarcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode: cleanBarcode } });
      if (existingBarcode) throw new Error(`Mã vạch [${cleanBarcode}] đã được sử dụng`);
    }

    // RÀNG BUỘC TỰ ĐỘNG C.5: Nếu có tên nhà cung cấp mà chưa có ID thì kiểm tra/tự động tạo mới
    let finalSupplierId = data.supplierId && data.supplierId.trim() ? data.supplierId.trim() : null;
    if (!finalSupplierId && data.supplierName && data.supplierName.trim()) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: { name: { equals: data.supplierName.trim(), mode: 'insensitive' } }
      });
      if (existingSupplier) {
        finalSupplierId = existingSupplier.id;
      } else {
        const count = await prisma.supplier.count();
        const supCode = `NCC-${String(count + 1).padStart(3, '0')}`;
        const newSupplier = await prisma.supplier.create({
          data: {
            code: supCode,
            name: data.supplierName.trim(),
            phone: data.supplierPhone || null,
            address: data.supplierAddress || null,
            status: 'ACTIVE'
          }
        });
        finalSupplierId = newSupplier.id;
      }
    } else if (finalSupplierId) {
      const sup = await prisma.supplier.findUnique({ where: { id: finalSupplierId } });
      if (!sup) finalSupplierId = null;
    }

    let finalCategoryId = data.categoryId && data.categoryId.trim() ? data.categoryId.trim() : null;
    let catName = data.category && data.category.trim() ? data.category.trim() : 'Văn phòng phẩm';
    if (finalCategoryId) {
      const cat = await prisma.category.findUnique({ where: { id: finalCategoryId } });
      if (cat) {
        catName = cat.name;
      } else {
        finalCategoryId = null;
      }
    }

    let finalWarehouseId = data.warehouseId && data.warehouseId.trim() ? data.warehouseId.trim() : null;
    if (finalWarehouseId) {
      const wh = await prisma.warehouse.findUnique({ where: { id: finalWarehouseId } });
      if (!wh) finalWarehouseId = null;
    }

    let finalProductTypeId = data.productTypeId && data.productTypeId.trim() ? data.productTypeId.trim() : null;
    if (finalProductTypeId) {
      const pt = await prisma.productType.findUnique({ where: { id: finalProductTypeId } });
      if (!pt) finalProductTypeId = null;
    }

    return prisma.product.create({
      data: {
        code,
        barcode: cleanBarcode,
        name: data.name.trim(),
        category: catName,
        categoryId: finalCategoryId,
        productTypeId: finalProductTypeId,
        warehouseId: finalWarehouseId,
        supplierId: finalSupplierId,
        unit: data.unit.trim(),
        costPrice: data.costPrice || 0,
        sellingPrice: data.sellingPrice || 0,
        vatRate: data.vatRate !== undefined ? Number(data.vatRate) : 8,
        stockQuantity: data.stockQuantity !== undefined ? Number(data.stockQuantity) : 100,
        minStockLevel: data.minStockLevel !== undefined ? Number(data.minStockLevel) : 20,
        color: data.color && data.color.trim() ? data.color.trim() : null,
        length: data.length !== undefined && data.length !== null && Number(data.length) !== 0 ? Number(data.length) : null,
        width: data.width !== undefined && data.width !== null && Number(data.width) !== 0 ? Number(data.width) : null,
        height: data.height !== undefined && data.height !== null && Number(data.height) !== 0 ? Number(data.height) : null,
        weight: data.weight !== undefined && data.weight !== null && Number(data.weight) !== 0 ? Number(data.weight) : null,
        description: data.description && data.description.trim() ? data.description.trim() : null,
        status: data.status || 'ACTIVE'
      },
      include: {
        warehouse: true,
        categoryRel: true,
        productType: true,
        supplier: true
      }
    });
  }

  async updateProduct(id: string, data: any) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error('Không tìm thấy sản phẩm');

    if (data.code && data.code.trim().toUpperCase() !== product.code) {
      const existing = await prisma.product.findUnique({ where: { code: data.code.trim().toUpperCase() } });
      if (existing) throw new Error(`Mã sản phẩm [${data.code}] đã tồn tại`);
    }

    const cleanBarcode = data.barcode !== undefined ? (data.barcode && data.barcode.trim() ? data.barcode.trim() : null) : undefined;
    if (cleanBarcode && cleanBarcode !== product.barcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode: cleanBarcode } });
      if (existingBarcode) throw new Error(`Mã vạch [${cleanBarcode}] đã được sử dụng`);
    }

    // Tự động tạo NCC nếu tên mới chưa có
    let finalSupplierId = data.supplierId !== undefined ? (data.supplierId && data.supplierId.trim() ? data.supplierId.trim() : null) : undefined;
    if (!finalSupplierId && data.supplierName && data.supplierName.trim()) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: { name: { equals: data.supplierName.trim(), mode: 'insensitive' } }
      });
      if (existingSupplier) {
        finalSupplierId = existingSupplier.id;
      } else {
        const count = await prisma.supplier.count();
        const supCode = `NCC-${String(count + 1).padStart(3, '0')}`;
        const newSupplier = await prisma.supplier.create({
          data: {
            code: supCode,
            name: data.supplierName.trim(),
            phone: data.supplierPhone || null,
            address: data.supplierAddress || null,
            status: 'ACTIVE'
          }
        });
        finalSupplierId = newSupplier.id;
      }
    } else if (finalSupplierId) {
      const sup = await prisma.supplier.findUnique({ where: { id: finalSupplierId } });
      if (!sup) finalSupplierId = null;
    }

    const updatePayload: any = {};
    if (data.code !== undefined) updatePayload.code = data.code.trim().toUpperCase();
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (cleanBarcode !== undefined) updatePayload.barcode = cleanBarcode;
    if (data.unit !== undefined) updatePayload.unit = data.unit.trim();
    if (data.costPrice !== undefined) updatePayload.costPrice = Number(data.costPrice) || 0;
    if (data.sellingPrice !== undefined) updatePayload.sellingPrice = Number(data.sellingPrice) || 0;
    if (data.vatRate !== undefined) updatePayload.vatRate = Number(data.vatRate) || 8;
    if (data.stockQuantity !== undefined) updatePayload.stockQuantity = Number(data.stockQuantity) || 0;
    if (data.minStockLevel !== undefined) updatePayload.minStockLevel = Number(data.minStockLevel) || 20;
    if (finalSupplierId !== undefined) updatePayload.supplierId = finalSupplierId;

    if (data.warehouseId !== undefined) {
      const wid = data.warehouseId && data.warehouseId.trim() ? data.warehouseId.trim() : null;
      if (wid) {
        const wh = await prisma.warehouse.findUnique({ where: { id: wid } });
        updatePayload.warehouseId = wh ? wid : null;
      } else {
        updatePayload.warehouseId = null;
      }
    }

    if (data.productTypeId !== undefined) {
      const ptid = data.productTypeId && data.productTypeId.trim() ? data.productTypeId.trim() : null;
      if (ptid) {
        const pt = await prisma.productType.findUnique({ where: { id: ptid } });
        updatePayload.productTypeId = pt ? ptid : null;
      } else {
        updatePayload.productTypeId = null;
      }
    }

    if (data.categoryId !== undefined) {
      const cid = data.categoryId && data.categoryId.trim() ? data.categoryId.trim() : null;
      if (cid) {
        const cat = await prisma.category.findUnique({ where: { id: cid } });
        if (cat) {
          updatePayload.categoryId = cid;
          updatePayload.category = cat.name;
        } else {
          updatePayload.categoryId = null;
        }
      } else {
        updatePayload.categoryId = null;
      }
    }
    if (data.category && !updatePayload.category) {
      updatePayload.category = data.category.trim();
    }

    if (data.color !== undefined) updatePayload.color = data.color && data.color.trim() ? data.color.trim() : null;
    if (data.length !== undefined) updatePayload.length = data.length !== '' && data.length !== null && Number(data.length) !== 0 ? Number(data.length) : null;
    if (data.width !== undefined) updatePayload.width = data.width !== '' && data.width !== null && Number(data.width) !== 0 ? Number(data.width) : null;
    if (data.height !== undefined) updatePayload.height = data.height !== '' && data.height !== null && Number(data.height) !== 0 ? Number(data.height) : null;
    if (data.weight !== undefined) updatePayload.weight = data.weight !== '' && data.weight !== null && Number(data.weight) !== 0 ? Number(data.weight) : null;
    if (data.description !== undefined) updatePayload.description = data.description && data.description.trim() ? data.description.trim() : null;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl;

    return prisma.product.update({
      where: { id },
      data: updatePayload,
      include: {
        warehouse: true,
        categoryRel: true,
        productType: true,
        supplier: true
      }
    });
  }

  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: { quotationItems: true, orderItems: true }
        }
      }
    });
    if (!product) throw new Error('Không tìm thấy sản phẩm');

    if (product._count.quotationItems > 0 || product._count.orderItems > 0) {
      // Soft delete
      return prisma.product.update({
        where: { id },
        data: { status: 'INACTIVE' }
      });
    }

    return prisma.product.delete({ where: { id } });
  }
}

export const productsService = new ProductsService();
