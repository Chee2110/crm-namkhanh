import { prisma } from '../../../config/db';

export class RevenueTypesService {
  async getRevenueTypes() {
    return prisma.revenueType.findMany({
      include: {
        _count: {
          select: { vouchers: true }
        }
      },
      orderBy: { code: 'asc' }
    });
  }

  async getRevenueTypeById(id: string) {
    const type = await prisma.revenueType.findUnique({
      where: { id },
      include: {
        vouchers: {
          orderBy: { voucherDate: 'desc' },
          take: 10
        }
      }
    });
    if (!type) throw new Error('Không tìm thấy nhóm loại khoản thu');
    return type;
  }

  async createRevenueType(data: { code: string; name: string; description?: string; status?: string }) {
    const existing = await prisma.revenueType.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Mã nhóm khoản thu [${data.code}] đã tồn tại`);

    return prisma.revenueType.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        status: data.status || 'ACTIVE'
      }
    });
  }

  async updateRevenueType(id: string, data: { name?: string; description?: string; status?: string }) {
    const existing = await prisma.revenueType.findUnique({ where: { id } });
    if (!existing) throw new Error('Không tìm thấy nhóm loại khoản thu');

    return prisma.revenueType.update({
      where: { id },
      data
    });
  }

  async deleteRevenueType(id: string) {
    const type = await prisma.revenueType.findUnique({
      where: { id },
      include: { _count: { select: { vouchers: true } } }
    });
    if (!type) throw new Error('Không tìm thấy nhóm loại khoản thu');

    if (type._count.vouchers > 0) {
      throw new Error('Không thể xóa nhóm khoản thu đã phát sinh phiếu thu tiền');
    }

    return prisma.revenueType.delete({ where: { id } });
  }
}

export const revenueTypesService = new RevenueTypesService();
