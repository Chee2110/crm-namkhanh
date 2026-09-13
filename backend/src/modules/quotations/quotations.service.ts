import { prisma } from '../../config/db';

export class QuotationsService {
  async getQuotations(params: {
    customerId?: string;
    managerId?: string;
    status?: string;
    search?: string;
    dataScope?: string;
    currentUserId?: string;
    departmentId?: string;
  }) {
    const where: any = {};

    if (params.dataScope === 'PERSONAL' && params.currentUserId) {
      where.managerId = params.currentUserId;
    } else if (params.dataScope === 'DEPARTMENT' && params.departmentId) {
      where.manager = { departmentId: params.departmentId };
    }

    if (params.customerId) where.customerId = params.customerId;
    if (params.managerId) where.managerId = params.managerId;
    if (params.status) where.status = params.status;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { customer: { name: { contains: params.search, mode: 'insensitive' } } },
        { notes: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    return prisma.quotation.findMany({
      where,
      include: {
        customer: {
          select: { id: true, code: true, name: true, phone: true, taxCode: true, address: true }
        },
        manager: {
          select: { id: true, fullName: true, code: true, email: true }
        },
        items: true,
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getQuotationById(id: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        manager: {
          select: { id: true, fullName: true, code: true, email: true, phone: true }
        },
        items: {
          include: {
            product: true
          }
        },
        orders: {
          select: { id: true, code: true, deliveryStatus: true, totalAmount: true }
        }
      }
    });

    if (!quotation) throw new Error('Không tìm thấy báo giá');
    return quotation;
  }

  async createQuotation(
    data: {
      customerId: string;
      date?: Date;
      validUntil?: Date;
      status?: string;
      notes?: string;
      vatRate?: number;
      items: Array<{
        productId?: string;
        productCode: string;
        productName: string;
        unit: string;
        quantity: number;
        unitPrice: number;
        vatRate?: number;
      }>;
    },
    creatorId: string
  ) {
    if (!data.items || data.items.length === 0) {
      throw new Error('Báo giá phải có ít nhất 1 sản phẩm / dòng hàng hóa');
    }

    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new Error('Không tìm thấy khách hàng được chọn');

    // Tự sinh mã báo giá BG-2026-XXXX
    const count = await prisma.quotation.count();
    const code = `BG-2026-${String(count + 1).padStart(4, '0')}`;

    // Tính toán số học tập trung tại Backend
    let subtotal = 0;
    const computedItems = data.items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const itemVat = item.vatRate !== undefined ? Number(item.vatRate) : (data.vatRate || 8);
      const amount = qty * price;
      const total = amount + (amount * itemVat) / 100;
      subtotal += amount;

      return {
        productId: item.productId || null,
        productCode: item.productCode,
        productName: item.productName,
        unit: item.unit,
        quantity: qty,
        unitPrice: price,
        amount,
        vatRate: itemVat,
        total
      };
    });

    const vatRate = data.vatRate !== undefined ? Number(data.vatRate) : 8;
    const vatAmount = (subtotal * vatRate) / 100;
    const totalAmount = subtotal + vatAmount;

    return prisma.quotation.create({
      data: {
        code,
        customerId: data.customerId,
        managerId: creatorId,
        date: data.date ? new Date(data.date) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        status: data.status || 'DRAFT',
        subtotal,
        vatRate,
        vatAmount,
        totalAmount,
        notes: data.notes,
        items: {
          create: computedItems
        }
      },
      include: {
        customer: true,
        manager: {
          select: { id: true, fullName: true, code: true }
        },
        items: true
      }
    });
  }

  async updateQuotation(id: string, data: any) {
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) throw new Error('Không tìm thấy báo giá');

    if (data.items && data.items.length > 0) {
      let subtotal = 0;
      const vatRate = data.vatRate !== undefined ? Number(data.vatRate) : quotation.vatRate;

      const computedItems = data.items.map((item: any) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice) || 0;
        const itemVat = item.vatRate !== undefined ? Number(item.vatRate) : vatRate;
        const amount = qty * price;
        const total = amount + (amount * itemVat) / 100;
        subtotal += amount;

        return {
          productId: item.productId || null,
          productCode: item.productCode,
          productName: item.productName,
          unit: item.unit,
          quantity: qty,
          unitPrice: price,
          amount,
          vatRate: itemVat,
          total
        };
      });

      const vatAmount = (subtotal * vatRate) / 100;
      const totalAmount = subtotal + vatAmount;

      return prisma.$transaction(async (tx: any) => {
        await tx.quotationItem.deleteMany({ where: { quotationId: id } });

        return tx.quotation.update({
          where: { id },
          data: {
            customerId: data.customerId || quotation.customerId,
            validUntil: data.validUntil ? new Date(data.validUntil) : quotation.validUntil,
            status: data.status || quotation.status,
            notes: data.notes !== undefined ? data.notes : quotation.notes,
            subtotal,
            vatRate,
            vatAmount,
            totalAmount,
            items: {
              create: computedItems
            }
          },
          include: { customer: true, items: true }
        });
      });
    }

    return prisma.quotation.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined
      },
      include: { customer: true, items: true }
    });
  }

  async convertToOrder(id: string, currentUserId: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true
      }
    });

    if (!quotation) throw new Error('Không tìm thấy báo giá');
    if (quotation.status !== 'CONFIRMED') {
      throw new Error('Chỉ có thể chuyển đổi Báo giá ở trạng thái "Đã chốt" (CONFIRMED) thành Đơn hàng');
    }

    const orderCount = await prisma.order.count();
    const orderCode = `DH-2026-${String(orderCount + 1).padStart(4, '0')}`;

    return prisma.$transaction(async (tx: any) => {
      const order = await tx.order.create({
        data: {
          code: orderCode,
          customerId: quotation.customerId,
          quotationId: quotation.id,
          managerId: quotation.managerId || currentUserId,
          orderDate: new Date(),
          deliveryAddress: quotation.customer.deliveryAddress || quotation.customer.address,
          contactPerson: quotation.customer.contactPerson,
          phone: quotation.customer.phone,
          deliveryStatus: 'PENDING',
          paymentStatus: 'UNPAID',
          invoiceStatus: 'NOT_ISSUED',
          subtotal: quotation.subtotal,
          vatRate: quotation.vatRate,
          vatAmount: quotation.vatAmount,
          totalAmount: quotation.totalAmount,
          paidAmount: 0,
          remainingAmount: quotation.totalAmount, // Tự tính: remaining = total - paid
          notes: `Đơn hàng tự động khởi tạo từ Báo giá ${quotation.code}`,
          items: {
            create: quotation.items.map((it: any) => ({
              productId: it.productId,
              productCode: it.productCode,
              productName: it.productName,
              unit: it.unit,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              amount: it.amount,
              vatRate: it.vatRate,
              total: it.total
            }))
          }
        },
        include: {
          customer: true,
          items: true
        }
      });

      return order;
    });
  }

  async deleteQuotation(id: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } }
    });
    if (!quotation) throw new Error('Không tìm thấy báo giá');

    if (quotation._count.orders > 0) {
      throw new Error('Không thể xóa báo giá đã được chuyển đổi thành Đơn hàng');
    }

    return prisma.quotation.delete({ where: { id } });
  }
}

export const quotationsService = new QuotationsService();
