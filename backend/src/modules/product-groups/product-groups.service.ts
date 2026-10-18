import { prisma } from '../../config/db';

export class ProductGroupsService {
  async getProductGroups(params?: {
    categoryId?: string;
    productTypeId?: string;
    search?: string;
  }) {
    const where: any = {};
    if (params?.productTypeId) {
      where.productTypeId = params.productTypeId;
    } else if (params?.categoryId) {
      where.productType = { categoryId: params.categoryId };
    }

    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    return prisma.productGroup.findMany({
      where,
      include: {
        productType: {
          select: {
            id: true,
            code: true,
            name: true,
            categoryId: true,
            category: {
              select: {
                id: true,
                code: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getProductGroupById(id: string) {
    const group = await prisma.productGroup.findUnique({
      where: { id },
      include: {
        productType: {
          include: {
            category: true
          }
        },
        products: true
      }
    });

    if (!group) throw new Error('Không tìm thấy nhóm hàng hóa');
    return group;
  }

  async createProductGroup(data: {
    code: string;
    name: string;
    productTypeId: string;
    description?: string;
  }) {
    const code = data.code.trim().toUpperCase();
    const existing = await prisma.productGroup.findUnique({ where: { code } });
    if (existing) throw new Error(`Mã nhóm hàng '${code}' đã tồn tại`);

    const productType = await prisma.productType.findUnique({ where: { id: data.productTypeId } });
    if (!productType) throw new Error('Loại hàng hóa cha không tồn tại');

    return prisma.productGroup.create({
      data: {
        code,
        name: data.name.trim(),
        productTypeId: data.productTypeId,
        description: data.description?.trim() || null,
        status: 'ACTIVE'
      },
      include: {
        productType: {
          include: { category: true }
        }
      }
    });
  }

  async updateProductGroup(id: string, data: {
    name?: string;
    productTypeId?: string;
    description?: string;
    status?: string;
  }) {
    const group = await prisma.productGroup.findUnique({ where: { id } });
    if (!group) throw new Error('Không tìm thấy nhóm hàng hóa');

    if (data.productTypeId && data.productTypeId !== group.productTypeId) {
      const pt = await prisma.productType.findUnique({ where: { id: data.productTypeId } });
      if (!pt) throw new Error('Loại hàng hóa cha không tồn tại');
    }

    return prisma.productGroup.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name.trim() : undefined,
        productTypeId: data.productTypeId || group.productTypeId,
        description: data.description !== undefined ? data.description.trim() : undefined,
        status: data.status || group.status
      },
      include: {
        productType: {
          include: { category: true }
        }
      }
    });
  }

  async deleteProductGroup(id: string) {
    const group = await prisma.productGroup.findUnique({
      where: { id },
      include: {
        products: { select: { id: true } }
      }
    });

    if (!group) throw new Error('Không tìm thấy nhóm hàng hóa');
    if (group.products.length > 0) {
      throw new Error(`Không thể xóa nhóm hàng này vì đang có ${group.products.length} sản phẩm trực thuộc`);
    }

    await prisma.productGroup.delete({ where: { id } });
    return { success: true, message: 'Đã xóa nhóm hàng hóa thành công' };
  }
}

export const productGroupsService = new ProductGroupsService();
