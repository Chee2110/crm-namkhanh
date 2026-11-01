import { prisma } from '../../config/db';
import { slugifyGroupCode } from '../product-groups/product-groups.service';

function normalizeLabel(val?: string | null): string {
  if (!val) return '';
  const trimmed = String(val).trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  // Chuẩn hóa chữ cái đầu viết hoa (ví dụ: 'bút chì' -> 'Bút chì', 'màng PE' -> 'Màng PE', 'Bút Dạ' -> 'Bút dạ')
  if (trimmed.toLowerCase() === 'bút dạ') return 'Bút dạ';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export class ProductsService {
  async getProducts(params?: {
    category?: string;
    categoryId?: string;
    productTypeId?: string;
    productGroupId?: string;
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
    if (params?.productGroupId) {
      const pg = await prisma.productGroup.findUnique({ where: { id: params.productGroupId } });
      if (pg) {
        where.OR = [
          { productGroupId: params.productGroupId },
          { subTypeName: { equals: pg.name, mode: 'insensitive' } }
        ];
      } else {
        where.productGroupId = params.productGroupId;
      }
    }
    if (params?.warehouseId) where.warehouseId = params.warehouseId;
    if (params?.supplierId) where.supplierId = params.supplierId;
    if (params?.status) where.status = params.status;

    if (params?.search) {
      const searchCond = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
        { subTypeName: { contains: params.search, mode: 'insensitive' } },
        { brand: { contains: params.search, mode: 'insensitive' } },
        { barcode: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } }
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCond }];
        delete where.OR;
      } else {
        where.OR = searchCond;
      }
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        categoryRel: { select: { id: true, code: true, name: true } },
        productType: { select: { id: true, code: true, name: true, unit: true, categoryId: true } },
        productGroup: { select: { id: true, code: true, name: true, productTypeId: true } },
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
        productGroup: true,
        supplier: true
      }
    });
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    return product;
  }

  private async resolveOrCreateProductGroup(
    productGroupId?: string | null,
    subTypeCode?: string | null,
    subTypeName?: string | null,
    productTypeId?: string | null
  ): Promise<{ id: string | null; code: string | null; name: string | null }> {
    const cleanGroupId = productGroupId && productGroupId.trim() ? productGroupId.trim() : null;
    const rawCode = subTypeCode && subTypeCode.trim() ? subTypeCode.trim().toUpperCase() : null;
    const rawName = normalizeLabel(subTypeName);

    if (cleanGroupId) {
      const pg = await prisma.productGroup.findUnique({ where: { id: cleanGroupId } });
      if (pg) {
        return {
          id: pg.id,
          code: rawCode || pg.code,
          name: rawName || pg.name
        };
      }
    }

    if (!rawName && !rawCode) {
      return { id: null, code: null, name: null };
    }

    let pg = null;
    if (rawName) {
      pg = await prisma.productGroup.findFirst({
        where: { name: { equals: rawName, mode: 'insensitive' } }
      });
    }
    if (!pg && rawCode) {
      pg = await prisma.productGroup.findUnique({ where: { code: rawCode } });
    }

    if (!pg) {
      const groupName = rawName || rawCode!;
      const baseCode = rawCode || slugifyGroupCode(groupName);
      let finalCode = baseCode;
      let counter = 2;
      while (await prisma.productGroup.findUnique({ where: { code: finalCode } })) {
        finalCode = `${baseCode}-${counter}`;
        counter++;
      }

      pg = await prisma.productGroup.create({
        data: {
          code: finalCode,
          name: groupName,
          productTypeId: productTypeId || null,
          status: 'ACTIVE'
        }
      });
    }

    return {
      id: pg.id,
      code: pg.code,
      name: pg.name
    };
  }

  private async resolveOrCreateWarehouse(
    warehouseId?: string | null,
    warehouseCode?: string | null,
    warehouseName?: string | null,
    fallbackDefault = false
  ): Promise<string | null> {
    const cleanId = warehouseId && warehouseId.trim() ? warehouseId.trim() : null;
    if (cleanId) {
      const wh = await prisma.warehouse.findUnique({ where: { id: cleanId } });
      if (wh) return wh.id;
    }

    const wCode = (warehouseCode || '').trim().toUpperCase();
    const wName = (warehouseName || '').trim();

    if (wCode || wName) {
      let wh = null;
      if (wCode) wh = await prisma.warehouse.findUnique({ where: { code: wCode } });
      if (!wh && wName) {
        wh = await prisma.warehouse.findFirst({
          where: { name: { equals: wName, mode: 'insensitive' } }
        });
      }
      if (!wh) {
        wh = await prisma.warehouse.create({
          data: {
            code: wCode || `WH-${Date.now().toString().slice(-4)}`,
            name: wName || wCode,
            status: 'ACTIVE'
          }
        });
      }
      return wh.id;
    }

    if (fallbackDefault) {
      let defaultWh = await prisma.warehouse.findUnique({ where: { code: 'NK01' } });
      if (!defaultWh) {
        defaultWh = await prisma.warehouse.findFirst({ where: { status: 'ACTIVE' } });
      }
      if (!defaultWh) {
        defaultWh = await prisma.warehouse.create({
          data: {
            code: 'NK01',
            name: 'Kho số 1',
            status: 'ACTIVE'
          }
        });
      }
      return defaultWh.id;
    }

    return null;
  }

  async createProduct(data: {
    code: string;
    barcode?: string;
    name: string;
    category?: string;
    categoryId?: string;
    categoryCode?: string;
    categoryName?: string;
    productTypeId?: string;
    productTypeCode?: string;
    productTypeName?: string;
    productGroupId?: string;
    productGroupCode?: string;
    productGroupName?: string;
    warehouseId?: string;
    warehouseCode?: string;
    warehouseName?: string;
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
    maxStockLevel?: number;
    brand?: string;
    specification?: string;
    subTypeCode?: string;
    subTypeName?: string;
    imageUrl?: string;
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

    // Tự động kiểm tra/tạo Nhà cung cấp nếu có tên mới
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

    // Kho lưu trữ (mặc định NK01 nếu bỏ trống)
    const finalWarehouseId = await this.resolveOrCreateWarehouse(
      data.warehouseId,
      data.warehouseCode,
      data.warehouseName,
      true
    );

    // Nhóm loại hàng hóa (cấp phân loại duy nhất theo file chuẩn)
    const rawSubCode = data.subTypeCode || data.productGroupCode || null;
    const rawSubName = data.subTypeName || data.productGroupName || null;
    const resolvedGroup = await this.resolveOrCreateProductGroup(
      data.productGroupId,
      rawSubCode,
      rawSubName,
      data.productTypeId || null
    );

    const finalCategoryId = data.categoryId && data.categoryId.trim() ? data.categoryId.trim() : null;
    const finalProductTypeId = data.productTypeId && data.productTypeId.trim() ? data.productTypeId.trim() : null;
    const catName =
      resolvedGroup.name ||
      (data.categoryName && data.categoryName.trim()) ||
      (data.category && data.category.trim()) ||
      'Văn phòng phẩm';

    const cleanUnit = normalizeLabel(data.unit) || 'Chiếc';

    return prisma.product.create({
      data: {
        code,
        barcode: cleanBarcode,
        name: data.name.trim(),
        category: catName,
        categoryId: finalCategoryId,
        productTypeId: finalProductTypeId,
        productGroupId: resolvedGroup.id,
        warehouseId: finalWarehouseId,
        supplierId: finalSupplierId,
        unit: cleanUnit,
        costPrice: data.costPrice || 0,
        sellingPrice: data.sellingPrice || 0,
        vatRate: data.vatRate !== undefined ? Number(data.vatRate) : 8,
        stockQuantity: data.stockQuantity !== undefined && data.stockQuantity !== null ? Number(data.stockQuantity) : 0,
        minStockLevel: data.minStockLevel !== undefined ? Number(data.minStockLevel) : 0,
        maxStockLevel: data.maxStockLevel !== undefined ? Number(data.maxStockLevel) : 1000,
        brand: data.brand && data.brand.trim() ? data.brand.trim() : null,
        specification: data.specification && data.specification.trim() ? data.specification.trim() : null,
        subTypeCode: resolvedGroup.code,
        subTypeName: resolvedGroup.name,
        color: data.color && data.color.trim() ? normalizeLabel(data.color) : null,
        imageUrl: data.imageUrl && data.imageUrl.trim() ? data.imageUrl.trim() : null,
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
        productGroup: true,
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

    const cleanBarcode =
      data.barcode !== undefined ? (data.barcode && data.barcode.trim() ? data.barcode.trim() : null) : undefined;
    if (cleanBarcode && cleanBarcode !== product.barcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode: cleanBarcode } });
      if (existingBarcode) throw new Error(`Mã vạch [${cleanBarcode}] đã được sử dụng`);
    }

    // Tự động tạo NCC nếu tên mới chưa có
    let finalSupplierId =
      data.supplierId !== undefined
        ? data.supplierId && data.supplierId.trim()
          ? data.supplierId.trim()
          : null
        : undefined;
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
    if (data.unit !== undefined) updatePayload.unit = normalizeLabel(data.unit) || data.unit.trim();
    if (data.costPrice !== undefined) updatePayload.costPrice = Number(data.costPrice) || 0;
    if (data.sellingPrice !== undefined) updatePayload.sellingPrice = Number(data.sellingPrice) || 0;
    if (data.vatRate !== undefined) updatePayload.vatRate = Number(data.vatRate) || 8;
    if (data.stockQuantity !== undefined) updatePayload.stockQuantity = Number(data.stockQuantity) || 0;
    if (data.minStockLevel !== undefined) updatePayload.minStockLevel = Number(data.minStockLevel) || 0;
    if (finalSupplierId !== undefined) updatePayload.supplierId = finalSupplierId;

    if (data.warehouseId !== undefined || data.warehouseCode !== undefined || data.warehouseName !== undefined) {
      const resolvedWhId = await this.resolveOrCreateWarehouse(
        data.warehouseId,
        data.warehouseCode,
        data.warehouseName,
        false
      );
      if (resolvedWhId) {
        updatePayload.warehouseId = resolvedWhId;
      }
    }

    // Xử lý Nhóm loại hàng hóa
    if (
      data.productGroupId !== undefined ||
      data.subTypeName !== undefined ||
      data.subTypeCode !== undefined ||
      data.productGroupName !== undefined
    ) {
      const resolvedGroup = await this.resolveOrCreateProductGroup(
        data.productGroupId,
        data.subTypeCode !== undefined ? data.subTypeCode : product.subTypeCode,
        data.subTypeName !== undefined ? data.subTypeName : data.productGroupName,
        product.productTypeId
      );
      updatePayload.productGroupId = resolvedGroup.id;
      updatePayload.subTypeCode = resolvedGroup.code;
      updatePayload.subTypeName = resolvedGroup.name;
      if (resolvedGroup.name) {
        updatePayload.category = resolvedGroup.name;
      }
    }

    if (data.maxStockLevel !== undefined) updatePayload.maxStockLevel = Number(data.maxStockLevel) || 1000;
    if (data.brand !== undefined) updatePayload.brand = data.brand && data.brand.trim() ? data.brand.trim() : null;
    if (data.specification !== undefined) {
      updatePayload.specification = data.specification && String(data.specification).trim() ? String(data.specification).trim() : null;
    }
    if (data.color !== undefined) {
      updatePayload.color = data.color && data.color.trim() ? normalizeLabel(data.color) : null;
    }
    if (data.length !== undefined) updatePayload.length = data.length !== '' && data.length !== null && Number(data.length) !== 0 ? Number(data.length) : null;
    if (data.width !== undefined) updatePayload.width = data.width !== '' && data.width !== null && Number(data.width) !== 0 ? Number(data.width) : null;
    if (data.height !== undefined) updatePayload.height = data.height !== '' && data.height !== null && Number(data.height) !== 0 ? Number(data.height) : null;
    if (data.weight !== undefined) updatePayload.weight = data.weight !== '' && data.weight !== null && Number(data.weight) !== 0 ? Number(data.weight) : null;
    if (data.description !== undefined) updatePayload.description = data.description && data.description.trim() ? data.description.trim() : null;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl && data.imageUrl.trim() ? data.imageUrl.trim() : null;

    return prisma.product.update({
      where: { id },
      data: updatePayload,
      include: {
        warehouse: true,
        categoryRel: true,
        productType: true,
        productGroup: true,
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
