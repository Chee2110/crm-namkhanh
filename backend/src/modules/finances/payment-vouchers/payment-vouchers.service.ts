import { prisma } from '../../../config/db';

export class PaymentVouchersService {
  async getPaymentVouchers(params?: {
    status?: string;
    categoryId?: string;
    typeId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (params?.status) where.status = params.status;
    if (params?.categoryId) where.categoryId = params.categoryId;
    if (params?.typeId) where.typeId = params.typeId;

    if (params?.startDate || params?.endDate) {
      where.voucherDate = {};
      if (params.startDate) where.voucherDate.gte = new Date(params.startDate);
      if (params.endDate) where.voucherDate.lte = new Date(params.endDate);
    }

    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { recipient: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { reason: { contains: params.search, mode: 'insensitive' } },
        { invoiceNumber: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    return prisma.paymentVoucher.findMany({
      where,
      include: {
        category: { select: { id: true, code: true, name: true } },
        type: { select: { id: true, code: true, name: true } },
        customer: { select: { id: true, code: true, name: true, phone: true } },
        order: { select: { id: true, code: true, totalAmount: true } },
        createdBy: { select: { id: true, fullName: true, code: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, code: true, email: true } }
      },
      orderBy: { voucherDate: 'desc' }
    });
  }

  async getPaymentVoucherById(id: string) {
    const voucher = await prisma.paymentVoucher.findUnique({
      where: { id },
      include: {
        category: true,
        type: true,
        customer: true,
        order: true,
        createdBy: { select: { id: true, fullName: true, code: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, code: true, email: true } }
      }
    });
    if (!voucher) throw new Error('Không tìm thấy phiếu chi');
    return voucher;
  }

  async createPaymentVoucher(
    data: {
      voucherDate?: Date | string;
      categoryId?: string;
      typeId?: string;
      recipient: string;
      phone?: string;
      address?: string;
      reason: string;
      amount: number;
      paymentMethod?: string;
      invoiceNumber?: string;
      invoiceDate?: Date | string;
      fileUrl?: string;
      fileName?: string;
      customerId?: string;
      orderId?: string;
      notes?: string;
    },
    userId?: string
  ) {
    if (!data.recipient || !data.amount || !data.reason) {
      throw new Error('Người nhận tiền, lý do chi và số tiền là các trường bắt buộc');
    }

    if (Number(data.amount) <= 0) {
      throw new Error('Số tiền chi phải lớn hơn 0');
    }

    // Tự sinh mã phiếu chi PC-2026-XXXX
    const count = await prisma.paymentVoucher.count();
    const code = `PC-2026-${String(count + 1).padStart(4, '0')}`;

    return prisma.paymentVoucher.create({
      data: {
        code,
        voucherDate: data.voucherDate ? new Date(data.voucherDate) : new Date(),
        categoryId: data.categoryId || null,
        typeId: data.typeId || null,
        recipient: data.recipient,
        phone: data.phone || null,
        address: data.address || null,
        reason: data.reason,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod || 'CASH',
        invoiceNumber: data.invoiceNumber || null,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        customerId: data.customerId || null,
        orderId: data.orderId || null,
        notes: data.notes || null,
        status: 'PENDING',
        createdById: userId || null
      },
      include: {
        category: true,
        type: true,
        customer: true,
        order: true
      }
    });
  }

  async updatePaymentVoucher(id: string, data: any) {
    const voucher = await prisma.paymentVoucher.findUnique({ where: { id } });
    if (!voucher) throw new Error('Không tìm thấy phiếu chi');

    // RÀNG BUỘC BẢO MẬT: Khóa sửa tuyệt đối khi ĐÃ CHI
    if (voucher.status === 'PAID') {
      throw new Error('Phiếu chi đã ở trạng thái [Đã chi] và bị KHÓA SỬA HOÀN TOÀN. Chỉ Tổng Giám Đốc mới có quyền mở khóa sửa!');
    }

    const updateData: any = {};
    if (data.voucherDate) updateData.voucherDate = new Date(data.voucherDate);
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.typeId !== undefined) updateData.typeId = data.typeId || null;
    if (data.recipient) updateData.recipient = data.recipient;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.reason) updateData.reason = data.reason;
    if (data.amount !== undefined) updateData.amount = Number(data.amount);
    if (data.paymentMethod) updateData.paymentMethod = data.paymentMethod;
    if (data.invoiceNumber !== undefined) updateData.invoiceNumber = data.invoiceNumber;
    if (data.invoiceDate !== undefined) updateData.invoiceDate = data.invoiceDate ? new Date(data.invoiceDate) : null;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.fileName !== undefined) updateData.fileName = data.fileName;
    if (data.customerId !== undefined) updateData.customerId = data.customerId || null;
    if (data.orderId !== undefined) updateData.orderId = data.orderId || null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.paymentVoucher.update({
      where: { id },
      data: updateData,
      include: { category: true, type: true, customer: true, order: true }
    });
  }

  async approvePaymentVoucher(
    id: string,
    action: 'APPROVE' | 'PAID' | 'REJECT',
    userId: string,
    rejectedReason?: string
  ) {
    const voucher = await prisma.paymentVoucher.findUnique({ where: { id } });
    if (!voucher) throw new Error('Không tìm thấy phiếu chi');

    if (voucher.status === 'PAID' && action !== 'REJECT') {
      throw new Error('Phiếu chi đã hoàn tất chi tiền, không thể phê duyệt lại');
    }

    let status = voucher.status;
    if (action === 'APPROVE') status = 'APPROVED';
    else if (action === 'PAID') status = 'PAID';
    else if (action === 'REJECT') status = 'REJECTED';

    return prisma.paymentVoucher.update({
      where: { id },
      data: {
        status,
        approvedById: userId,
        approvedAt: new Date(),
        rejectedReason: action === 'REJECT' ? rejectedReason || 'Quản lý từ chối chi' : null
      },
      include: {
        category: true,
        type: true,
        approvedBy: { select: { id: true, fullName: true, code: true } }
      }
    });
  }

  // ĐẶC QUYỀN TỔNG GIÁM ĐỐC (CEO): Mở khóa sửa chứng từ đã chi kèm Audit Log
  async overridePaymentVoucher(id: string, data: any, ceoUser: any, ipAddress?: string) {
    const isCeoOrAdmin = ceoUser.roles.includes('CEO') || ceoUser.roles.includes('ADMIN');
    if (!isCeoOrAdmin) {
      throw new Error('Chỉ duy nhất Tổng Giám Đốc (CEO) hoặc Admin mới có quyền mở khóa sửa chứng từ Đã chi!');
    }

    const voucher = await prisma.paymentVoucher.findUnique({ where: { id } });
    if (!voucher) throw new Error('Không tìm thấy phiếu chi');

    const oldValue = {
      recipient: voucher.recipient,
      amount: Number(voucher.amount),
      reason: voucher.reason,
      status: voucher.status,
      voucherDate: voucher.voucherDate
    };

    const updateData: any = {};
    if (data.recipient) updateData.recipient = data.recipient;
    if (data.amount !== undefined) updateData.amount = Number(data.amount);
    if (data.reason) updateData.reason = data.reason;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.status) updateData.status = data.status;
    if (data.voucherDate) updateData.voucherDate = new Date(data.voucherDate);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedVoucher] = await prisma.$transaction([
      prisma.paymentVoucher.update({
        where: { id },
        data: updateData,
        include: { category: true, type: true }
      }),
      prisma.auditLog.create({
        data: {
          userId: ceoUser.id,
          action: 'OVERRIDE_PAYMENT_VOUCHER',
          entityType: 'PaymentVoucher',
          entityId: id,
          oldValue,
          newValue: updateData,
          ipAddress: ipAddress || null
        }
      })
    ]);

    return updatedVoucher;
  }

  async deletePaymentVoucher(id: string) {
    const voucher = await prisma.paymentVoucher.findUnique({ where: { id } });
    if (!voucher) throw new Error('Không tìm thấy phiếu chi');

    if (voucher.status === 'PAID') {
      throw new Error('Không thể xóa phiếu chi đã hoàn tất chi tiền!');
    }

    return prisma.paymentVoucher.delete({ where: { id } });
  }
}

export const paymentVouchersService = new PaymentVouchersService();
