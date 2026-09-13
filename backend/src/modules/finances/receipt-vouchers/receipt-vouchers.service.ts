import { prisma } from '../../../config/db';

export class ReceiptVouchersService {
  async getReceiptVouchers(params?: {
    status?: string;
    typeId?: string;
    customerId?: string;
    orderId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (params?.status) where.status = params.status;
    if (params?.typeId) where.typeId = params.typeId;
    if (params?.customerId) where.customerId = params.customerId;
    if (params?.orderId) where.orderId = params.orderId;

    if (params?.startDate || params?.endDate) {
      where.voucherDate = {};
      if (params.startDate) where.voucherDate.gte = new Date(params.startDate);
      if (params.endDate) where.voucherDate.lte = new Date(params.endDate);
    }

    if (params?.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { payer: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } },
        { reason: { contains: params.search, mode: 'insensitive' } },
        { invoiceNumber: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    return prisma.receiptVoucher.findMany({
      where,
      include: {
        type: { select: { id: true, code: true, name: true } },
        customer: { select: { id: true, code: true, name: true, phone: true } },
        order: {
          select: {
            id: true,
            code: true,
            totalAmount: true,
            paidAmount: true,
            remainingAmount: true,
            paymentStatus: true
          }
        },
        allocations: {
          include: {
            order: {
              select: { id: true, code: true, totalAmount: true, paidAmount: true, remainingAmount: true, paymentStatus: true }
            }
          }
        },
        createdBy: { select: { id: true, fullName: true, code: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, code: true, email: true } }
      },
      orderBy: { voucherDate: 'desc' }
    });
  }

  async getReceiptVoucherById(id: string) {
    const voucher = await prisma.receiptVoucher.findUnique({
      where: { id },
      include: {
        type: true,
        customer: true,
        order: true,
        allocations: {
          include: {
            order: true
          }
        },
        createdBy: { select: { id: true, fullName: true, code: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, code: true, email: true } }
      }
    });
    if (!voucher) throw new Error('Không tìm thấy phiếu thu');
    return voucher;
  }

  async createReceiptVoucher(
    data: {
      voucherDate?: Date | string;
      typeId?: string;
      payer: string;
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
      allocations?: Array<{ orderId: string; amount: number }>;
    },
    userId?: string
  ) {
    if (!data.payer || !data.amount || !data.reason) {
      throw new Error('Người nộp tiền, lý do thu và số tiền là bắt buộc');
    }

    if (Number(data.amount) <= 0) {
      throw new Error('Số tiền thu phải lớn hơn 0');
    }

    // Tự sinh mã phiếu thu PT-2026-XXXX
    const count = await prisma.receiptVoucher.count();
    const code = `PT-2026-${String(count + 1).padStart(4, '0')}`;

    return prisma.receiptVoucher.create({
      data: {
        code,
        voucherDate: data.voucherDate ? new Date(data.voucherDate) : new Date(),
        typeId: data.typeId || null,
        payer: data.payer,
        phone: data.phone || null,
        address: data.address || null,
        reason: data.reason,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod || 'BANK_TRANSFER',
        invoiceNumber: data.invoiceNumber || null,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        customerId: data.customerId || null,
        orderId: data.orderId || null,
        notes: data.notes || null,
        status: 'PENDING',
        createdById: userId || null,
        allocations: data.allocations && data.allocations.length > 0 ? {
          create: data.allocations.map((al) => ({
            orderId: al.orderId,
            amount: Number(al.amount)
          }))
        } : undefined
      },
      include: {
        type: true,
        customer: true,
        order: true,
        allocations: {
          include: {
            order: true
          }
        }
      }
    });
  }

  async updateReceiptVoucher(id: string, data: any) {
    const voucher = await prisma.receiptVoucher.findUnique({ where: { id } });
    if (!voucher) throw new Error('Không tìm thấy phiếu thu');

    // RÀNG BUỘC BẢO MẬT: Khóa sửa tuyệt đối khi ĐÃ THU
    if (voucher.status === 'PAID') {
      throw new Error('Phiếu thu đã ở trạng thái [Đã thu] và bị KHÓA SỬA HOÀN TOÀN để bảo toàn công nợ. Chỉ Tổng Giám Đốc mới có quyền mở khóa sửa!');
    }

    const updateData: any = {};
    if (data.voucherDate) updateData.voucherDate = new Date(data.voucherDate);
    if (data.typeId !== undefined) updateData.typeId = data.typeId || null;
    if (data.payer) updateData.payer = data.payer;
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

    return prisma.receiptVoucher.update({
      where: { id },
      data: updateData,
      include: { type: true, customer: true, order: true }
    });
  }

  // DUYỆT PHIẾU THU & TỰ ĐỘNG GẠCH NỢ ĐƠN HÀNG (DATABASE TRANSACTION)
  async approveReceiptVoucher(
    id: string,
    action: 'APPROVE' | 'PAID' | 'REJECT',
    userId: string,
    rejectedReason?: string
  ) {
    const voucher = await prisma.receiptVoucher.findUnique({
      where: { id },
      include: { order: true, allocations: true }
    });
    if (!voucher) throw new Error('Không tìm thấy phiếu thu');

    if (voucher.status === 'PAID' && action !== 'REJECT') {
      throw new Error('Phiếu thu đã được xác nhận [Đã thu], không thể duyệt lại');
    }

    return prisma.$transaction(async (tx) => {
      let status = voucher.status;
      if (action === 'APPROVE') status = 'APPROVED';
      else if (action === 'PAID') status = 'PAID';
      else if (action === 'REJECT') status = 'REJECTED';

      // Cập nhật phiếu thu
      const updatedVoucher = await tx.receiptVoucher.update({
        where: { id },
        data: {
          status,
          approvedById: userId,
          approvedAt: new Date(),
          rejectedReason: action === 'REJECT' ? rejectedReason || 'Quản lý từ chối thu' : null
        },
        include: {
          type: true,
          customer: true,
          order: true,
          allocations: {
            include: { order: true }
          },
          approvedBy: { select: { id: true, fullName: true, code: true } }
        }
      });

      // RÀNG BUỘC CỐT LÕI: KHI CHUYỂN SANG ĐÃ THU (PAID) -> GẠCH NỢ TỰ ĐỘNG
      if (action === 'PAID') {
        if (voucher.allocations && voucher.allocations.length > 0) {
          // Gạch nợ đa đơn hàng theo danh sách phân bổ (Mục IX.3)
          for (const alloc of voucher.allocations) {
            const order = await tx.order.findUnique({ where: { id: alloc.orderId } });
            if (order) {
              const allocatedAmount = Number(alloc.amount);
              const newPaid = Number(order.paidAmount) + allocatedAmount;
              const total = Number(order.totalAmount);
              const newRemaining = Math.max(0, total - newPaid);

              let newPaymentStatus = 'UNPAID';
              if (newPaid >= total && total > 0) {
                newPaymentStatus = 'PAID';
              } else if (newPaid > 0) {
                newPaymentStatus = 'PARTIAL_PAID';
              }

              await tx.order.update({
                where: { id: alloc.orderId },
                data: {
                  paidAmount: newPaid,
                  remainingAmount: newRemaining,
                  paymentStatus: newPaymentStatus
                }
              });
            }
          }
        } else if (voucher.orderId) {
          // Fallback gạch nợ 1 đơn hàng cũ
          const order = await tx.order.findUnique({ where: { id: voucher.orderId } });
          if (order) {
            const paidInc = Number(voucher.amount);
            const newPaidAmount = Number(order.paidAmount) + paidInc;
            const total = Number(order.totalAmount);
            const newRemaining = Math.max(0, total - newPaidAmount);

            let newPaymentStatus = 'UNPAID';
            if (newPaidAmount >= total && total > 0) {
              newPaymentStatus = 'PAID';
            } else if (newPaidAmount > 0) {
              newPaymentStatus = 'PARTIAL_PAID';
            }

            await tx.order.update({
              where: { id: voucher.orderId },
              data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemaining,
                paymentStatus: newPaymentStatus
              }
            });
          }
        }
      }

      return updatedVoucher;
    });
  }

  // ĐẶC QUYỀN TỔNG GIÁM ĐỐC (CEO): Mở khóa sửa phiếu đã thu kèm cập nhật chênh lệch công nợ và Audit Log
  async overrideReceiptVoucher(id: string, data: any, ceoUser: any, ipAddress?: string) {
    const isCeoOrAdmin = ceoUser.roles.includes('CEO') || ceoUser.roles.includes('ADMIN');
    if (!isCeoOrAdmin) {
      throw new Error('Chỉ duy nhất Tổng Giám Đốc (CEO) hoặc Admin mới có quyền mở khóa sửa chứng từ Đã thu!');
    }

    const voucher = await prisma.receiptVoucher.findUnique({
      where: { id },
      include: { order: true }
    });
    if (!voucher) throw new Error('Không tìm thấy phiếu thu');

    const oldValue = {
      payer: voucher.payer,
      amount: Number(voucher.amount),
      reason: voucher.reason,
      status: voucher.status,
      voucherDate: voucher.voucherDate,
      orderId: voucher.orderId
    };

    return prisma.$transaction(async (tx) => {
      // Nếu phiếu đang ở trạng thái PAID và có sự thay đổi số tiền hoặc đổi đơn hàng
      if (voucher.status === 'PAID' && voucher.orderId) {
        const oldAmount = Number(voucher.amount);
        const newAmount = data.amount !== undefined ? Number(data.amount) : oldAmount;
        const diff = newAmount - oldAmount;

        if (diff !== 0) {
          const order = await tx.order.findUnique({ where: { id: voucher.orderId } });
          if (order) {
            const newPaid = Number(order.paidAmount) + diff;
            const total = Number(order.totalAmount);
            const newRem = Math.max(0, total - newPaid);

            let newStatus = 'UNPAID';
            if (newPaid >= total && total > 0) newStatus = 'PAID';
            else if (newPaid > 0) newStatus = 'PARTIAL_PAID';

            await tx.order.update({
              where: { id: voucher.orderId },
              data: {
                paidAmount: newPaid,
                remainingAmount: newRem,
                paymentStatus: newStatus
              }
            });
          }
        }
      }

      const updateData: any = {};
      if (data.payer) updateData.payer = data.payer;
      if (data.amount !== undefined) updateData.amount = Number(data.amount);
      if (data.reason) updateData.reason = data.reason;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.status) updateData.status = data.status;
      if (data.voucherDate) updateData.voucherDate = new Date(data.voucherDate);
      if (data.notes !== undefined) updateData.notes = data.notes;

      const updated = await tx.receiptVoucher.update({
        where: { id },
        data: updateData,
        include: { type: true, customer: true, order: true }
      });

      await tx.auditLog.create({
        data: {
          userId: ceoUser.id,
          action: 'OVERRIDE_RECEIPT_VOUCHER',
          entityType: 'ReceiptVoucher',
          entityId: id,
          oldValue,
          newValue: updateData,
          ipAddress: ipAddress || null
        }
      });

      return updated;
    });
  }

  async deleteReceiptVoucher(id: string) {
    const voucher = await prisma.receiptVoucher.findUnique({ where: { id } });
    if (!voucher) throw new Error('Không tìm thấy phiếu thu');

    if (voucher.status === 'PAID') {
      throw new Error('Không thể xóa phiếu thu đã hoàn tất [Đã thu] để tránh sai lệch kế toán và công nợ!');
    }

    return prisma.receiptVoucher.delete({ where: { id } });
  }
}

export const receiptVouchersService = new ReceiptVouchersService();
