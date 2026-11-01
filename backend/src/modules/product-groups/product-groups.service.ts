import { prisma } from '../../config/db';

export function slugifyGroupCode(name: string): string {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || `NH-${Date.now().toString().slice(-4)}`;
}

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
      orderBy: { name: 'asc' }
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

    if (!group) throw new Error('Không tìm thấy nhóm loại hàng hóa');
    return group;
  }

  async createProductGroup(data: {
    code?: string;
    name: string;
    productTypeId?: string | null;
    description?: string;
  }) {
    const cleanName = data.name.trim();
    if (!cleanName) throw new Error('Vui lòng nhập tên nhóm loại hàng hóa');

    const existingByName = await prisma.productGroup.findFirst({
      where: { name: { equals: cleanName, mode: 'insensitive' } }
    });
    if (existingByName) {
      throw new Error(`Nhóm loại hàng '${cleanName}' đã tồn tại (Mã: ${existingByName.code})`);
    }

    let finalCode = data.code && data.code.trim() ? data.code.trim().toUpperCase() : '';
    if (finalCode) {
      const existingByCode = await prisma.productGroup.findUnique({ where: { code: finalCode } });
      if (existingByCode) throw new Error(`Mã nhóm loại '${finalCode}' đã tồn tại`);
    } else {
      const baseCode = slugifyGroupCode(cleanName);
      finalCode = baseCode;
      let counter = 2;
      while (await prisma.productGroup.findUnique({ where: { code: finalCode } })) {
        finalCode = `${baseCode}-${counter}`;
        counter++;
      }
    }

    let validProductTypeId: string | null = null;
    if (data.productTypeId && data.productTypeId.trim()) {
      const pt = await prisma.productType.findUnique({ where: { id: data.productTypeId.trim() } });
      if (pt) validProductTypeId = pt.id;
    }

    return prisma.productGroup.create({
      data: {
        code: finalCode,
        name: cleanName,
        productTypeId: validProductTypeId,
        description: data.description?.trim() || null,
        status: 'ACTIVE'
      },
      include: {
        productType: {
          include: { category: true }
        },
        _count: {
          select: { products: true }
        }
      }
    });
  }

  async updateProductGroup(id: string, data: {
    code?: string;
    name?: string;
    productTypeId?: string | null;
    description?: string;
    status?: string;
  }) {
    const group = await prisma.productGroup.findUnique({ where: { id } });
    if (!group) throw new Error('Không tìm thấy nhóm loại hàng hóa');

    let newCode = group.code;
    if (data.code && data.code.trim() && data.code.trim().toUpperCase() !== group.code) {
      newCode = data.code.trim().toUpperCase();
      const existingCode = await prisma.productGroup.findUnique({ where: { code: newCode } });
      if (existingCode) throw new Error(`Mã nhóm loại '${newCode}' đã được sử dụng`);
    }

    const newName = data.name !== undefined ? data.name.trim() : group.name;
    if (newName.toLowerCase() !== group.name.toLowerCase()) {
      const existingName = await prisma.productGroup.findFirst({
        where: {
          name: { equals: newName, mode: 'insensitive' },
          id: { not: id }
        }
      });
      if (existingName) throw new Error(`Tên nhóm loại '${newName}' đã tồn tại`);
    }

    let validProductTypeId: string | null | undefined = undefined;
    if (data.productTypeId !== undefined) {
      if (data.productTypeId && data.productTypeId.trim()) {
        const pt = await prisma.productType.findUnique({ where: { id: data.productTypeId.trim() } });
        validProductTypeId = pt ? pt.id : null;
      } else {
        validProductTypeId = null;
      }
    }

    const updated = await prisma.productGroup.update({
      where: { id },
      data: {
        code: newCode,
        name: newName,
        ...(validProductTypeId !== undefined ? { productTypeId: validProductTypeId } : {}),
        description: data.description !== undefined ? data.description.trim() : undefined,
        status: data.status || group.status
      },
      include: {
        productType: {
          include: { category: true }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    // Đồng bộ tên/mã nhóm loại trên các sản phẩm trực thuộc
    if (newName !== group.name || newCode !== group.code) {
      await prisma.product.updateMany({
        where: { productGroupId: id },
        data: {
          subTypeCode: newCode,
          subTypeName: newName,
          category: newName
        }
      });
    }

    return updated;
  }

  async deleteProductGroup(id: string) {
    const group = await prisma.productGroup.findUnique({
      where: { id },
      include: {
        products: { select: { id: true } }
      }
    });

    if (!group) throw new Error('Không tìm thấy nhóm loại hàng hóa');
    if (group.products.length > 0) {
      throw new Error(`Không thể xóa nhóm loại này vì đang có ${group.products.length} sản phẩm trực thuộc`);
    }

    await prisma.productGroup.delete({ where: { id } });
    return { success: true, message: 'Đã xóa nhóm loại hàng hóa thành công' };
  }
}

export const productGroupsService = new ProductGroupsService();
