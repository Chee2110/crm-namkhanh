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
    const existing = await prisma.product.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Mã sản phẩm [${data.code}] đã tồn tại`);

    if (data.barcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode: data.barcode } });
      if (existingBarcode) throw new Error(`Mã vạch [${data.barcode}] đã được sử dụng`);
    }

    // RÀNG BUỘC TỰ ĐỘNG C.5: Nếu có tên nhà cung cấp mà chưa có ID thì kiểm tra/tự động tạo mới
    let finalSupplierId = data.supplierId || null;
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
    }

    let catName = data.category || 'Giấy in văn phòng';
    if (data.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (cat) catName = cat.name;
    }

    return prisma.product.create({
      data: {
        code: data.code,
        barcode: data.barcode || null,
        name: data.name,
        category: catName,
        categoryId: data.categoryId || null,
        productTypeId: data.productTypeId || null,
        warehouseId: data.warehouseId || null,
        supplierId: finalSupplierId,
        unit: data.unit,
        costPrice: data.costPrice || 0,
        sellingPrice: data.sellingPrice || 0,
        vatRate: data.vatRate ?? 8,
        stockQuantity: data.stockQuantity ?? 100,
        minStockLevel: data.minStockLevel ?? 20,
        color: data.color || null,
        length: data.length !== undefined ? data.length : null,
        width: data.width !== undefined ? data.width : null,
        height: data.height !== undefined ? data.height : null,
        weight: data.weight !== undefined ? data.weight : null,
        description: data.description || null,
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

    if (data.code && data.code !== product.code) {
      const existing = await prisma.product.findUnique({ where: { code: data.code } });
      if (existing) throw new Error(`Mã sản phẩm [${data.code}] đã tồn tại`);
    }

    if (data.barcode && data.barcode !== product.barcode) {
      const existingBarcode = await prisma.product.findUnique({ where: { barcode: data.barcode } });
      if (existingBarcode) throw new Error(`Mã vạch [${data.barcode}] đã được sử dụng`);
    }

    // Tự động tạo NCC nếu tên mới chưa có
    if (!data.supplierId && data.supplierName && data.supplierName.trim()) {
      const existingSupplier = await prisma.supplier.findFirst({
        where: { name: { equals: data.supplierName.trim(), mode: 'insensitive' } }
      });
      if (existingSupplier) {
        data.supplierId = existingSupplier.id;
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
        data.supplierId = newSupplier.id;
      }
    }
    delete data.supplierName;
    delete data.supplierPhone;
    delete data.supplierAddress;

    return prisma.product.update({
      where: { id },
      data,
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
