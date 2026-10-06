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
    highDebtOnly?: boolean;
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

    const customers = await prisma.customer.findMany({
      where,
      include: {
        manager: {
          select: { id: true, fullName: true, code: true, email: true }
        },
        _count: {
          select: { quotations: true, orders: true }
        },
        orders: {
          select: { remainingAmount: true, totalAmount: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const mapped = customers.map((c: any) => {
      const totalDebt = (c.orders || []).reduce((sum: number, o: any) => sum + Number(o.remainingAmount || 0), 0);
      const totalSpent = (c.orders || []).reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
      const { orders: _, ...rest } = c;
      return {
        ...rest,
        totalDebt,
        totalSpent,
        isHighDebt: totalDebt > 50000000
      };
    });

    if (params.highDebtOnly) {
      return mapped.filter((c: any) => c.totalDebt > 50000000);
    }

    return mapped;
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

    const creditLimit = Number(customer.creditLimit) || 50000000;
    const maxDebtDays = customer.maxDebtDays || 30;
    const creditUsedPercent = creditLimit > 0 ? Math.min(100, Math.round((totalDebt / creditLimit) * 100)) : 0;
    const isOverCreditLimit = totalDebt > creditLimit;
    const availableCredit = Math.max(0, creditLimit - totalDebt);

    return {
      ...customer,
      analytics: {
        totalSpent,
        totalPaid,
        totalDebt,
        creditLimit,
        maxDebtDays,
        creditUsedPercent,
        isOverCreditLimit,
        availableCredit,
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
      creditLimit?: number | string;
      maxDebtDays?: number | string;
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
        status: data.status || 'ACTIVE',
        creditLimit: data.creditLimit !== undefined ? Number(data.creditLimit) : 50000000,
        maxDebtDays: data.maxDebtDays !== undefined ? Number(data.maxDebtDays) : 30
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

    const updateData: any = { ...data };
    if (data.creditLimit !== undefined) {
      updateData.creditLimit = Number(data.creditLimit);
    }
    if (data.maxDebtDays !== undefined) {
      updateData.maxDebtDays = Number(data.maxDebtDays);
    }

    return prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: { id: true, fullName: true, code: true, email: true }
        }
      }
    });
  }

  async getCustomerDebtStatement(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        manager: {
          select: { id: true, fullName: true, code: true, email: true, phone: true }
        }
      }
    });

    if (!customer) throw new Error('Không tìm thấy khách hàng');

    const orders = await prisma.order.findMany({
      where: { customerId: id },
      select: {
        id: true,
        code: true,
        orderDate: true,
        totalAmount: true,
        paidAmount: true,
        remainingAmount: true,
        deliveryStatus: true,
        paymentStatus: true
      },
      orderBy: { orderDate: 'asc' }
    });

    const receipts = await prisma.receiptVoucher.findMany({
      where: { customerId: id, status: { in: ['APPROVED', 'PAID'] } },
      select: {
        id: true,
        code: true,
        voucherDate: true,
        amount: true,
        reason: true,
        paymentMethod: true
      },
      orderBy: { voucherDate: 'asc' }
    });

    const totalOrdersAmount = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
    const totalPaidAmount = receipts.length > 0
      ? receipts.reduce((sum: number, r: any) => sum + Number(r.amount), 0)
      : orders.reduce((sum: number, o: any) => sum + Number(o.paidAmount), 0);
    const remainingDebt = Math.max(0, totalOrdersAmount - totalPaidAmount);

    return {
      customer,
      orders,
      receipts,
      summary: {
        totalOrdersAmount,
        totalPaidAmount,
        remainingDebt,
        creditLimit: Number(customer.creditLimit),
        maxDebtDays: customer.maxDebtDays
      }
    };
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

    const [quotations, orders, handovers, receipts] = await Promise.all([
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
      }),
      prisma.receiptVoucher.findMany({
        where: { customerId: id },
        include: {
          createdBy: { select: { fullName: true } },
          approvedBy: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Gom nhóm timeline theo thời gian (Báo giá, Đơn hàng, Phiếu thu, Bàn giao)
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
      ...receipts.map((r: any) => ({
        id: r.id,
        type: 'RECEIPT',
        title: `Phiếu thu: ${r.code}`,
        status: r.status,
        amount: r.amount,
        paymentMethod: r.paymentMethod,
        date: r.voucherDate || r.createdAt,
        notes: r.reason,
        actor: r.approvedBy?.fullName || r.createdBy?.fullName || 'Kế toán'
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
