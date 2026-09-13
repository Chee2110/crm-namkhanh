import { prisma } from '../../config/db';

export class CustomersService {
  async getCustomers(params: {
    search?: string;
    customerType?: string;
    source?: string;
    managerId?: string;
    status?: string;
    dataScope?: string;
    currentUserId?: string;
    departmentId?: string;
  }) {
    const where: any = {};

    // Row-level data scope
    if (params.dataScope === 'PERSONAL' && params.currentUserId) {
      where.managerId = params.currentUserId;
    } else if (params.dataScope === 'DEPARTMENT' && params.departmentId) {
      where.manager = { departmentId: params.departmentId };
    }

    if (params.customerType) {
      where.customerType = params.customerType;
    }
    if (params.source) {
      where.source = params.source;
    }
    if (params.managerId) {
      where.managerId = params.managerId;
    }
    if (params.status) {
      where.status = params.status;
    }
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { name: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { taxCode: { contains: params.search, mode: 'insensitive' } },
        { contactPerson: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    return prisma.customer.findMany({
      where,
      include: {
        manager: {
          select: { id: true, fullName: true, code: true, email: true }
        },
        _count: {
          select: { quotations: true, orders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, fullName: true, code: true, email: true, phone: true }
        },
        quotations: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        handovers: {
          include: {
            fromUser: { select: { id: true, fullName: true, code: true } },
            toUser: { select: { id: true, fullName: true, code: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!customer) throw new Error('Không tìm thấy khách hàng');

    // Thống kê tài chính khách hàng
    const orders = await prisma.order.findMany({
      where: { customerId: id },
      select: { totalAmount: true, paidAmount: true, remainingAmount: true, orderDate: true }
    });

    const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
    const totalPaid = orders.reduce((sum: number, o: any) => sum + Number(o.paidAmount), 0);
    const totalDebt = orders.reduce((sum: number, o: any) => sum + Number(o.remainingAmount), 0);
    const lastOrderDate = orders.length > 0 ? orders[0].orderDate : null;

    return {
      ...customer,
      analytics: {
        totalSpent,
        totalPaid,
        totalDebt,
        orderCount: orders.length,
        lastOrderDate
      }
    };
  }

  async createCustomer(
    data: {
      code?: string;
      name: string;
      phone: string;
      taxCode?: string;
      address?: string;
      deliveryAddress?: string;
      customerType?: string;
      source?: string;
      contactPerson?: string;
      email?: string;
      notes?: string;
      managerId?: string;
      status?: string;
    },
    creatorId: string
  ) {
    // 1. Kiểm tra trùng SĐT
    const existPhone = await prisma.customer.findUnique({ where: { phone: data.phone } });
    if (existPhone) {
      throw new Error(`Số điện thoại [${data.phone}] đã tồn tại cho khách hàng "${existPhone.name}" (${existPhone.code})`);
    }

    // 2. Kiểm tra trùng Mã số thuế
    if (data.taxCode) {
      const existTax = await prisma.customer.findUnique({ where: { taxCode: data.taxCode } });
      if (existTax) {
        throw new Error(`Mã số thuế [${data.taxCode}] đã tồn tại cho khách hàng "${existTax.name}" (${existTax.code})`);
      }
    }

    // Tự sinh mã KH nếu chưa có
    let code = data.code;
    if (!code) {
      const count = await prisma.customer.count();
      code = `KH${String(count + 1).padStart(4, '0')}`;
    }

    return prisma.customer.create({
      data: {
        code,
        name: data.name,
        phone: data.phone,
        taxCode: data.taxCode || null,
        address: data.address,
        deliveryAddress: data.deliveryAddress || data.address,
        customerType: data.customerType || 'ENTERPRISE',
        source: data.source || 'SELF_FOUND',
        contactPerson: data.contactPerson,
        email: data.email,
        notes: data.notes,
        managerId: data.managerId || creatorId,
        status: data.status || 'ACTIVE'
      },
      include: {
        manager: {
          select: { id: true, fullName: true, code: true, email: true }
        }
      }
    });
  }

  async updateCustomer(id: string, data: any) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new Error('Không tìm thấy khách hàng');

    // Kiểm tra trùng SĐT nếu thay đổi
    if (data.phone && data.phone !== customer.phone) {
      const existPhone = await prisma.customer.findUnique({ where: { phone: data.phone } });
      if (existPhone) {
        throw new Error(`Số điện thoại [${data.phone}] đã tồn tại cho khách hàng "${existPhone.name}"`);
      }
    }

    // Kiểm tra trùng MST nếu thay đổi
    if (data.taxCode && data.taxCode !== customer.taxCode) {
      const existTax = await prisma.customer.findUnique({ where: { taxCode: data.taxCode } });
      if (existTax) {
        throw new Error(`Mã số thuế [${data.taxCode}] đã tồn tại cho khách hàng "${existTax.name}"`);
      }
    }

    return prisma.customer.update({
      where: { id },
      data,
      include: {
        manager: {
          select: { id: true, fullName: true, code: true, email: true }
        }
      }
    });
  }

  async deleteCustomer(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { quotations: true, orders: true }
        }
      }
    });
    if (!customer) throw new Error('Không tìm thấy khách hàng');

    if (customer._count.quotations > 0 || customer._count.orders > 0) {
      // Soft delete
      return prisma.customer.update({
        where: { id },
        data: { status: 'INACTIVE' }
      });
    }

    return prisma.customer.delete({ where: { id } });
  }

  async handoverCustomer(id: string, toUserId: string, reason: string, fromUserId?: string) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new Error('Không tìm thấy khách hàng');

    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) throw new Error('Không tìm thấy nhân viên nhận bàn giao');

    return prisma.$transaction(async (tx: any) => {
      const history = await tx.customerHandoverHistory.create({
        data: {
          customerId: id,
          fromUserId: fromUserId || customer.managerId,
          toUserId,
          reason
        }
      });

      const updatedCustomer = await tx.customer.update({
        where: { id },
        data: { managerId: toUserId },
        include: {
          manager: {
            select: { id: true, fullName: true, code: true, email: true }
          }
        }
      });

      return { customer: updatedCustomer, history };
    });
  }

  async getCustomerTimeline(id: string) {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new Error('Không tìm thấy khách hàng');

    const [quotations, orders, handovers] = await Promise.all([
      prisma.quotation.findMany({
        where: { customerId: id },
        include: { manager: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.findMany({
        where: { customerId: id },
        include: { manager: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.customerHandoverHistory.findMany({
        where: { customerId: id },
        include: {
          fromUser: { select: { fullName: true } },
          toUser: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Gom nhóm timeline theo thời gian
    const timeline = [
      ...quotations.map((q: any) => ({
        id: q.id,
        type: 'QUOTATION',
        title: `Báo giá: ${q.code}`,
        status: q.status,
        amount: q.totalAmount,
        date: q.createdAt,
        notes: q.notes,
        actor: q.manager?.fullName
      })),
      ...orders.map((o: any) => ({
        id: o.id,
        type: 'ORDER',
        title: `Đơn hàng: ${o.code}`,
        status: o.deliveryStatus,
        paymentStatus: o.paymentStatus,
        amount: o.totalAmount,
        paid: o.paidAmount,
        remaining: o.remainingAmount,
        date: o.createdAt,
        notes: o.notes,
        actor: o.manager?.fullName
      })),
      ...handovers.map((h: any) => ({
        id: h.id,
        type: 'HANDOVER',
        title: `Bàn giao quản lý khách hàng`,
        from: h.fromUser?.fullName || 'Hệ thống',
        to: h.toUser.fullName,
        reason: h.reason,
        date: h.createdAt,
        actor: h.toUser.fullName
      }))
    ];

    timeline.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return timeline;
  }
}

export const customersService = new CustomersService();
