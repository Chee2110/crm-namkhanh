import { prisma } from '../../config/db';

export class SuppliersService {
  async getSuppliers(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
        { taxCode: { contains: search, mode: 'insensitive' } }
      ];
    }

    return prisma.supplier.findMany({
      where,
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSupplierById(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            categoryRel: true,
            productType: true,
            warehouse: true
          }
        }
      }
    });

    if (!supplier) throw new Error('Không tìm thấy nhà cung cấp');
    return supplier;
  }

  async getSupplierProducts(id: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new Error('Không tìm thấy nhà cung cấp');

    return prisma.product.findMany({
      where: { supplierId: id },
      include: {
        categoryRel: true,
        productType: true,
        warehouse: true
      },
      orderBy: { code: 'asc' }
    });
  }

  async createSupplier(data: {
    code?: string;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    taxCode?: string;
    contactPerson?: string;
    notes?: string;
  }) {
    let code = data.code;
    if (!code) {
      const count = await prisma.supplier.count();
      code = `NCC-${String(count + 1).padStart(3, '0')}`;
    }

    const existing = await prisma.supplier.findUnique({ where: { code } });
    if (existing) throw new Error(`Mã nhà cung cấp '${code}' đã tồn tại`);

    return prisma.supplier.create({
      data: {
        code,
        name: data.name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        taxCode: data.taxCode,
        contactPerson: data.contactPerson,
        notes: data.notes,
        status: 'ACTIVE'
      }
    });
  }

  async updateSupplier(id: string, data: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    taxCode?: string;
    contactPerson?: string;
    notes?: string;
    status?: string;
  }) {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new Error('Không tìm thấy nhà cung cấp');

    return prisma.supplier.update({
      where: { id },
      data
    });
  }

  async deleteSupplier(id: string) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: { select: { id: true } }
      }
    });

    if (!supplier) throw new Error('Không tìm thấy nhà cung cấp');
    if (supplier.products.length > 0) {
      throw new Error(`Không thể xóa nhà cung cấp '${supplier.name}' vì đang có ${supplier.products.length} sản phẩm cung ứng liên kết.`);
    }

    return prisma.supplier.delete({ where: { id } });
  }
}

export const suppliersService = new SuppliersService();
