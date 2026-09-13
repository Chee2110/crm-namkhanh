import { prisma } from '../../../config/db';

export class ExpenseCategoriesService {
  // === CATEGORIES (CẤP 1) ===
  async getCategories() {
    return prisma.expenseCategory.findMany({
      include: {
        types: {
          orderBy: { code: 'asc' }
        },
        _count: {
          select: { vouchers: true }
        }
      },
      orderBy: { code: 'asc' }
    });
  }

  async getCategoryById(id: string) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        types: true,
        vouchers: {
          orderBy: { voucherDate: 'desc' },
          take: 10
        }
      }
    });
    if (!category) throw new Error('Không tìm thấy danh mục chi phí');
    return category;
  }

  async createCategory(data: { code: string; name: string; description?: string; status?: string }) {
    const existing = await prisma.expenseCategory.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Mã danh mục chi phí [${data.code}] đã tồn tại`);

    return prisma.expenseCategory.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        status: data.status || 'ACTIVE'
      },
      include: { types: true }
    });
  }

  async updateCategory(id: string, data: { name?: string; description?: string; status?: string }) {
    const existing = await prisma.expenseCategory.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy danh mục chi phí');

    return prisma.expenseCategory.update({
      where: { id },
      data,
      include: { types: true }
    });
  }

  async deleteCategory(id: string) {
    const category = await prisma.expenseCategory.findUnique({
      where: { id },
      include: {
        types: true,
        _count: { select: { vouchers: true } }
      }
    });
    if (!category) throw new Error('Không tìm thấy danh mục chi phí');

    if (category.types.length > 0) {
      throw new Error('Không thể xóa danh mục chi phí còn chứa các loại chi phí con');
    }
    if (category._count.vouchers > 0) {
      throw new Error('Không thể xóa danh mục chi phí đã phát sinh phiếu chi tiền');
    }

    return prisma.expenseCategory.delete({ where: { id } });
  }

  // === EXPENSE TYPES (CẤP 2) ===
  async getTypes(categoryId?: string) {
    const where: any = {};
    if (categoryId) where.categoryId = categoryId;

    return prisma.expenseType.findMany({
      where,
      include: {
        category: {
          select: { id: true, code: true, name: true }
        },
        _count: {
          select: { vouchers: true }
        }
      },
      orderBy: { code: 'asc' }
    });
  }

  async createType(data: { code: string; name: string; categoryId: string; description?: string; status?: string }) {
    const existing = await prisma.expenseType.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Mã loại chi phí [${data.code}] đã tồn tại`);

    const category = await prisma.expenseCategory.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new Error('Danh mục chi phí cha không tồn tại');

    return prisma.expenseType.create({
      data: {
        code: data.code,
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        status: data.status || 'ACTIVE'
      },
      include: { category: true }
    });
  }

  async updateType(id: string, data: { name?: string; categoryId?: string; description?: string; status?: string }) {
    const existing = await prisma.expenseType.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy loại chi phí');

    return prisma.expenseType.update({
      where: { id },
      data,
      include: { category: true }
    });
  }

  async deleteType(id: string) {
    const type = await prisma.expenseType.findUnique({
      where: { id },
      include: { _count: { select: { vouchers: true } } }
    });
    if (!type) throw new Error('Không tìm thấy loại chi phí');

    if (type._count.vouchers > 0) {
      throw new Error('Không thể xóa loại chi phí đã phát sinh phiếu chi tiền');
    }

    return prisma.expenseType.delete({ where: { id } });
  }
}

export const expenseCategoriesService = new ExpenseCategoriesService();
