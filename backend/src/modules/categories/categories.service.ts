import { prisma } from '../../config/db';

export class CategoriesService {
  async getCategories(warehouseId?: string, search?: string) {
    const where: any = {};
    if (warehouseId) where.warehouseId = warehouseId;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.category.findMany({
      where,
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        productTypes: { select: { id: true, code: true, name: true } },
        _count: {
          select: { productTypes: true, products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        warehouse: true,
        productTypes: true,
        products: true
      }
    });

    if (!category) throw new Error('Không tìm thấy danh mục');
    return category;
  }

  async createCategory(data: {
    code: string;
    name: string;
    warehouseId?: string;
    description?: string;
  }) {
    const existing = await prisma.category.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Mã danh mục '${data.code}' đã tồn tại`);

    return prisma.category.create({
      data: {
        code: data.code,
        name: data.name,
        warehouseId: data.warehouseId || null,
        description: data.description,
        status: 'ACTIVE'
      },
      include: { warehouse: true }
    });
  }

  async updateCategory(id: string, data: {
    name?: string;
    warehouseId?: string;
    description?: string;
    status?: string;
  }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw new Error('Không tìm thấy danh mục');

    return prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        warehouseId: data.warehouseId !== undefined ? data.warehouseId : category.warehouseId,
        description: data.description,
        status: data.status || category.status
      },
      include: { warehouse: true }
    });
  }

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        productTypes: true,
        products: true
      }
    });

    if (!category) throw new Error('Không tìm thấy danh mục');
    if (category.productTypes.length > 0) {
      throw new Error(`Không thể xóa danh mục '${category.name}' vì đang chứa ${category.productTypes.length} loại hàng hóa con.`);
    }
    if (category.products.length > 0) {
      throw new Error(`Không thể xóa danh mục '${category.name}' vì đang có ${category.products.length} sản phẩm trực thuộc.`);
    }

    return prisma.category.delete({ where: { id } });
  }
}

export const categoriesService = new CategoriesService();
