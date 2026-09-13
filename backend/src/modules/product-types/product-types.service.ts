import { prisma } from '../../config/db';

export class ProductTypesService {
  async getProductTypes(categoryId?: string, search?: string) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.productType.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            warehouse: { select: { id: true, code: true, name: true } }
          }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getProductTypeById(id: string) {
    const type = await prisma.productType.findUnique({
      where: { id },
      include: {
        category: { include: { warehouse: true } },
        products: true
      }
    });

    if (!type) throw new Error('Không tìm thấy loại hàng hóa');
    return type;
  }

  async createProductType(data: {
    code: string;
    name: string;
    categoryId: string;
    unit?: string;
    description?: string;
  }) {
    const existing = await prisma.productType.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Mã loại hàng '${data.code}' đã tồn tại`);

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new Error('Danh mục cha không tồn tại');

    return prisma.productType.create({
      data: {
        code: data.code,
        name: data.name,
        categoryId: data.categoryId,
        unit: data.unit,
        description: data.description,
        status: 'ACTIVE'
      },
      include: { category: true }
    });
  }

  async updateProductType(id: string, data: {
    name?: string;
    categoryId?: string;
    unit?: string;
    description?: string;
    status?: string;
  }) {
    const type = await prisma.productType.findUnique({ where: { id } });
    if (!type) throw new Error('Không tìm thấy loại hàng hóa');

    return prisma.productType.update({
      where: { id },
      data: {
        name: data.name,
        categoryId: data.categoryId || type.categoryId,
        unit: data.unit !== undefined ? data.unit : type.unit,
        description: data.description,
        status: data.status || type.status
      },
      include: { category: true }
    });
  }

  async deleteProductType(id: string) {
    const type = await prisma.productType.findUnique({
      where: { id },
      include: {
        products: { select: { id: true } }
      }
    });

    if (!type) throw new Error('Không tìm thấy loại hàng hóa');
    if (type.products.length > 0) {
      throw new Error(`Không thể xóa loại hàng '${type.name}' vì đang có ${type.products.length} sản phẩm liên kết.`);
    }

    return prisma.productType.delete({ where: { id } });
  }
}

export const productTypesService = new ProductTypesService();
