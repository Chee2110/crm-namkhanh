import { prisma } from '../../config/db';

export class WarehousesService {
  async getWarehouses(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        department: { select: { id: true, name: true, code: true } },
        categories: { select: { id: true, name: true, code: true } },
        products: {
          select: { id: true, stockQuantity: true, costPrice: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return warehouses.map((wh) => {
      const totalSku = wh.products.length;
      const totalStock = wh.products.reduce((sum, p) => sum + p.stockQuantity, 0);
      const totalValue = wh.products.reduce((sum, p) => sum + p.stockQuantity * Number(p.costPrice), 0);

      return {
        id: wh.id,
        code: wh.code,
        name: wh.name,
        address: wh.address,
        phone: wh.phone,
        departmentId: wh.departmentId,
        department: wh.department,
        status: wh.status,
        categoryCount: wh.categories.length,
        totalSku,
        totalStock,
        totalValue,
        createdAt: wh.createdAt
      };
    });
  }

  async getWarehouseById(id: string) {
    const wh = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        department: true,
        categories: {
          include: {
            productTypes: true
          }
        },
        products: {
          include: {
            productType: true,
            supplier: true
          }
        }
      }
    });

    if (!wh) throw new Error('Không tìm thấy kho vật lý');
    return wh;
  }

  async createWarehouse(data: {
    code: string;
    name: string;
    address?: string;
    phone?: string;
    departmentId?: string;
  }) {
    const existing = await prisma.warehouse.findUnique({ where: { code: data.code } });
    if (existing) throw new Error(`Mã kho '${data.code}' đã tồn tại trên hệ thống`);

    return prisma.warehouse.create({
      data: {
        code: data.code,
        name: data.name,
        address: data.address,
        phone: data.phone,
        departmentId: data.departmentId || null,
        status: 'ACTIVE'
      },
      include: { department: true }
    });
  }

  async updateWarehouse(id: string, data: {
    name?: string;
    address?: string;
    phone?: string;
    departmentId?: string;
    status?: string;
  }) {
    const wh = await prisma.warehouse.findUnique({ where: { id } });
    if (!wh) throw new Error('Không tìm thấy kho vật lý');

    return prisma.warehouse.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        departmentId: data.departmentId !== undefined ? data.departmentId : wh.departmentId,
        status: data.status || wh.status
      },
      include: { department: true }
    });
  }

  async deleteWarehouse(id: string) {
    const wh = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        products: { select: { id: true, stockQuantity: true } }
      }
    });

    if (!wh) throw new Error('Không tìm thấy kho vật lý');

    const totalStock = wh.products.reduce((sum, p) => sum + p.stockQuantity, 0);
    if (totalStock > 0 || wh.products.length > 0) {
      throw new Error(`Không thể xóa kho '${wh.name}' vì đang còn ${wh.products.length} mặt hàng tồn kho.`);
    }

    return prisma.warehouse.delete({ where: { id } });
  }
}

export const warehousesService = new WarehousesService();
