import { prisma } from '../../config/db';

export class OrdersService {
  async getOrders(params: {
    customerId?: string;
    managerId?: string;
    deliveryStatus?: string;
    paymentStatus?: string;
    invoiceStatus?: string;
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
    if (params.deliveryStatus) where.deliveryStatus = params.deliveryStatus;
    if (params.paymentStatus) where.paymentStatus = params.paymentStatus;
    if (params.invoiceStatus) where.invoiceStatus = params.invoiceStatus;
    if (params.search) {
      where.OR = [
        { code: { contains: params.search, mode: 'insensitive' } },
        { customer: { name: { contains: params.search, mode: 'insensitive' } } },
        { contactPerson: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    return prisma.order.findMany({
      where,
      include: {
        customer: {
          select: { id: true, code: true, name: true, phone: true, taxCode: true, address: true }
        },
        manager: {
          select: { id: true, fullName: true, code: true, email: true }
        },
        quotation: {
          select: { id: true, code: true }
        },
        items: true,
        handovers: {
          include: {
            fromUser: { select: { fullName: true } },
            toUser: { select: { fullName: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        manager: {
          select: { id: true, fullName: true, code: true, email: true, phone: true }
        },
        quotation: true,
        items: {
          include: {
            product: true
          }
        },
        handovers: {
          include: {
            fromUser: { select: { fullName: true } },
            toUser: { select: { fullName: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        returns: {
          include: {
            items: true,
            createdBy: { select: { fullName: true, code: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
        allocations: {
          include: {
            voucher: { select: { id: true, code: true, voucherDate: true, amount: true, status: true } }
          }
        }
      }
    });

    if (!order) throw new Error('Không tìm thấy đơn hàng');
    return order;
  }

  async createOrder(
    data: {
      customerId: string;
      quotationId?: string;
      deliveryAddress?: string;
      contactPerson?: string;
      phone?: string;
      orderDate?: Date;
      deliveryDate?: Date;
      deliveryStatus?: string;
      paymentStatus?: string;
      invoiceStatus?: string;
      paidAmount?: number;
      useCreditBalance?: boolean;
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
      throw new Error('Đơn hàng phải có ít nhất 1 sản phẩm / dòng hàng hóa');
    }

    const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
    if (!customer) throw new Error('Không tìm thấy khách hàng được chọn');

    const count = await prisma.order.count();
    const code = `DH-2026-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    const computedItems = data.items.map((item) => {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.unitPrice) || 0;
      const amount = qty * price;
      const itemVat = item.vatRate !== undefined ? Number(item.vatRate) : (data.vatRate !== undefined ? Number(data.vatRate) : 8);
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
    let paidAmount = Number(data.paidAmount) || 0;

    // CẤN TRỪ SỐ DƯ KÝ QUỸ / TIỀN TRẢ TRƯỚC (Mục IX.1 - Tình huống 1 Phương án B)
    let creditDeducted = 0;
    const availableCredit = Number(customer.creditBalance) || 0;
    if (data.useCreditBalance && availableCredit > 0) {
      creditDeducted = Math.min(availableCredit, Math.max(0, totalAmount - paidAmount));
      paidAmount += creditDeducted;
    }

    // RÀNG BUỘC CÔNG NỢ TỰ ĐỘNG: Còn phải thu = Giá trị đơn hàng - Thực thu (Server-side calculation)
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    let paymentStatus = data.paymentStatus || 'UNPAID';
    if (paidAmount >= totalAmount && totalAmount > 0) {
      paymentStatus = 'PAID';
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL_PAID';
    }

    let finalNotes = data.notes || '';
    if (creditDeducted > 0) {
      finalNotes = `${finalNotes}\n[CẤN TRỪ SỐ DƯ KÝ QUỸ]: Đã khấu trừ ${creditDeducted.toLocaleString('vi-VN')} đ từ tiền trả trước của khách hàng.`.trim();
    }

    return prisma.$transaction(async (tx: any) => {
      // Giảm trừ creditBalance của khách hàng nếu có sử dụng
      if (creditDeducted > 0) {
        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            creditBalance: {
              decrement: creditDeducted
            }
          }
        });
      }

      const newOrder = await tx.order.create({
        data: {
          code,
          customerId: data.customerId,
          quotationId: data.quotationId || null,
          managerId: creatorId,
          orderDate: data.orderDate ? new Date(data.orderDate) : new Date(),
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
          deliveryAddress: data.deliveryAddress || customer.deliveryAddress || customer.address,
          contactPerson: data.contactPerson || customer.contactPerson,
          phone: data.phone || customer.phone,
          deliveryStatus: data.deliveryStatus || 'PENDING',
          paymentStatus,
          invoiceStatus: data.invoiceStatus || 'NOT_ISSUED',
          subtotal,
          vatRate,
          vatAmount,
          totalAmount,
          paidAmount,
          remainingAmount,
          notes: finalNotes,
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

      // Nếu đơn hàng tạo mới đã ở trạng thái ĐÃ GIAO HÀNG (DELIVERED) -> Trừ tồn kho tức thời
      if (data.deliveryStatus === 'DELIVERED') {
        for (const item of computedItems) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  decrement: item.quantity
                }
              }
            });
          }
        }
      }

      return newOrder;
    });
  }

  async updateOrder(id: string, data: any) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    const updateData: any = {
      deliveryAddress: data.deliveryAddress,
      contactPerson: data.contactPerson,
      phone: data.phone,
      invoiceStatus: data.invoiceStatus,
      notes: data.notes,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined
    };

    if (data.deliveryStatus) {
      updateData.deliveryStatus = data.deliveryStatus;
    }

    if (data.paidAmount !== undefined) {
      const paid = Number(data.paidAmount);
      updateData.paidAmount = paid;
      const total = Number(order.totalAmount);
      updateData.remainingAmount = Math.max(0, total - paid);

      if (paid >= total && total > 0) {
        updateData.paymentStatus = 'PAID';
      } else if (paid > 0) {
        updateData.paymentStatus = 'PARTIAL_PAID';
      } else {
        updateData.paymentStatus = 'UNPAID';
      }
    }

    if (data.paymentStatus) {
      updateData.paymentStatus = data.paymentStatus;
    }

    return prisma.$transaction(async (tx: any) => {
      // RÀNG BUỘC KHO TỰ ĐỘNG (Sprint 3 & 4):
      // 1. Khi đơn hàng đổi trạng thái sang 'DELIVERED' -> Trừ tồn kho các sản phẩm trong đơn
      if (data.deliveryStatus && data.deliveryStatus !== order.deliveryStatus) {
        if (data.deliveryStatus === 'DELIVERED' && order.deliveryStatus !== 'DELIVERED') {
          for (const item of order.items) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stockQuantity: {
                    decrement: item.quantity
                  }
                }
              });
            }
          }
        }
        // 2. Nếu đơn hàng trước đó đã giao (DELIVERED) nhưng bị chuyển ngược lại trạng thái khác -> Hoàn trả tồn kho
        else if (order.deliveryStatus === 'DELIVERED' && data.deliveryStatus !== 'DELIVERED') {
          for (const item of order.items) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: {
                  stockQuantity: {
                    increment: item.quantity
                  }
                }
              });
            }
          }
        }
      }

      const updated = await tx.order.update({
        where: { id },
        data: updateData,
        include: {
          customer: true,
          manager: { select: { id: true, fullName: true, code: true } },
          items: true
        }
      });

      return updated;
    });
  }

  async handoverOrder(id: string, toUserId: string, reason: string, fromUserId?: string) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    const toUser = await prisma.user.findUnique({ where: { id: toUserId } });
    if (!toUser) throw new Error('Không tìm thấy nhân viên nhận bàn giao');

    return prisma.$transaction(async (tx: any) => {
      const history = await tx.orderHandoverHistory.create({
        data: {
          orderId: id,
          fromUserId: fromUserId || order.managerId,
          toUserId,
          reason
        }
      });

      const updatedOrder = await tx.order.update({
        where: { id },
        data: { managerId: toUserId },
        include: {
          manager: { select: { id: true, fullName: true, code: true } }
        }
      });

      return { order: updatedOrder, history };
    });
  }

  async deleteOrder(id: string) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    if (order.deliveryStatus === 'DELIVERED' || Number(order.paidAmount) > 0) {
      throw new Error('Không thể xóa đơn hàng đã giao hoặc đã phát sinh thanh toán thực thu');
    }

    return prisma.order.delete({ where: { id } });
  }

  // Nghiệp vụ Mục IX: Hủy đơn & Hoàn tiền cọc
  async cancelOrderWithRefund(
    id: string,
    refundMethod: 'CASH_REFUND' | 'CREDIT_BALANCE',
    refundReason?: string,
    userId?: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: { customer: true, items: true }
    });
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    if (order.deliveryStatus === 'CANCELLED') throw new Error('Đơn hàng này đã ở trạng thái Đã hủy trước đó');

    const paid = Number(order.paidAmount);

    return prisma.$transaction(async (tx: any) => {
      // Nếu đơn hàng trước đó đã giao (DELIVERED) -> Hoàn trả tồn kho lại cho kho
      if (order.deliveryStatus === 'DELIVERED') {
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  increment: item.quantity
                }
              }
            });
          }
        }
      }

      let createdPaymentVoucher = null;

      if (paid > 0) {
        if (refundMethod === 'CREDIT_BALANCE') {
          // Cộng vào số dư tiền trả trước của khách hàng
          await tx.customer.update({
            where: { id: order.customerId },
            data: {
              creditBalance: {
                increment: paid
              }
            }
          });
        } else if (refundMethod === 'CASH_REFUND') {
          // Tự động tạo Phiếu chi hoàn tiền
          const pvCount = await tx.paymentVoucher.count();
          const pvCode = `PC-${new Date().getFullYear()}-${String(pvCount + 1).padStart(4, '0')}`;

          createdPaymentVoucher = await tx.paymentVoucher.create({
            data: {
              code: pvCode,
              voucherDate: new Date(),
              recipient: order.customer.name,
              phone: order.phone || order.customer.phone,
              address: order.deliveryAddress || order.customer.address,
              reason: `Hoàn tiền cọc đơn hàng ${order.code}: ${refundReason || 'Khách hủy đơn'}`,
              amount: paid,
              paymentMethod: 'BANK_TRANSFER',
              status: 'APPROVED',
              customerId: order.customerId,
              orderId: order.id,
              createdById: userId || null,
              notes: 'Tự động tạo từ quy trình Hủy đơn hàng hoàn tiền (Mục IX)'
            }
          });
        }
      }

      // Cập nhật trạng thái đơn hàng
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          deliveryStatus: 'CANCELLED',
          paymentStatus: paid > 0 ? 'REFUNDED' : 'UNPAID',
          refundAmount: paid,
          remainingAmount: 0,
          notes: `${order.notes || ''}\n[ĐÃ HỦY ĐƠN]: ${refundReason || 'Khách hủy đơn'}. Hoàn tiền: ${paid.toLocaleString('vi-VN')} đ qua ${refundMethod === 'CREDIT_BALANCE' ? 'Số dư ký quỹ' : 'Phiếu chi hoàn tiền'}.`.trim()
        },
        include: {
          customer: true,
          manager: { select: { id: true, fullName: true, code: true } }
        }
      });

      return { order: updatedOrder, paymentVoucher: createdPaymentVoucher };
    });
  }

  // Nghiệp vụ Mục IX: Điều chỉnh tăng/giảm tiền đơn hàng sau bán (+/-)
  async adjustOrderAmount(id: string, adjustedAmount: number, reason: string) {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new Error('Không tìm thấy đơn hàng');
    if (order.deliveryStatus === 'CANCELLED') throw new Error('Không thể điều chỉnh đơn hàng đã hủy');

    const adj = Number(adjustedAmount) || 0;
    const baseAmount = Number(order.subtotal) + Number(order.vatAmount);
    const newTotalAmount = Math.max(0, baseAmount + adj);
    const paid = Number(order.paidAmount);
    const newRemainingAmount = Math.max(0, newTotalAmount - paid);

    let paymentStatus = order.paymentStatus;
    if (paid >= newTotalAmount && newTotalAmount > 0) {
      paymentStatus = 'PAID';
    } else if (paid > 0) {
      paymentStatus = 'PARTIAL_PAID';
    } else {
      paymentStatus = 'UNPAID';
    }

    return prisma.order.update({
      where: { id },
      data: {
        adjustedAmount: adj,
        adjustmentReason: reason,
        totalAmount: newTotalAmount,
        remainingAmount: newRemainingAmount,
        paymentStatus
      },
      include: {
        customer: true,
        manager: { select: { id: true, fullName: true, code: true } },
        items: true
      }
    });
  }

  // ==============================================================
  // NGHIỆP VỤ MỤC IX.1 (TÌNH HUỐNG 2): ĐỔI TRẢ HÀNG / HOÀN KHO TỪNG PHẦN
  // ==============================================================
  async createOrderReturn(
    orderId: string,
    data: {
      returnDate?: Date | string;
      reason: string;
      refundMethod: 'DEDUCT_DEBT' | 'CASH_REFUND' | 'CREDIT_BALANCE';
      items: Array<{
        productId?: string;
        productCode: string;
        productName: string;
        unit: string;
        quantity: number;
        unitPrice: number;
      }>;
    },
    userId?: string
  ) {
    if (!data.items || data.items.length === 0) {
      throw new Error('Phiếu trả hàng phải có ít nhất 1 sản phẩm hoàn trả');
    }
    if (!data.reason || !data.reason.trim()) {
      throw new Error('Vui lòng nhập lý do trả hàng');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: true }
    });
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    const totalReturnAmount = data.items.reduce((sum, it) => sum + (Number(it.quantity) * Number(it.unitPrice)), 0);
    if (totalReturnAmount <= 0) {
      throw new Error('Tổng giá trị hàng trả phải lớn hơn 0');
    }

    const returnCount = await prisma.orderReturn.count();
    const returnCode = `TH-2026-${String(returnCount + 1).padStart(4, '0')}`;

    return prisma.$transaction(async (tx: any) => {
      // 1. Tạo bản ghi Phiếu trả hàng
      const orderReturn = await tx.orderReturn.create({
        data: {
          code: returnCode,
          orderId,
          returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
          reason: data.reason.trim(),
          totalRefundAmount: totalReturnAmount,
          refundMethod: data.refundMethod,
          status: 'COMPLETED',
          createdById: userId || null,
          items: {
            create: data.items.map((it) => ({
              productId: it.productId || null,
              productCode: it.productCode,
              productName: it.productName,
              unit: it.unit,
              quantity: Number(it.quantity),
              unitPrice: Number(it.unitPrice),
              amount: Number(it.quantity) * Number(it.unitPrice)
            }))
          }
        },
        include: {
          items: true,
          createdBy: { select: { fullName: true, code: true } }
        }
      });

      // 2. Cộng lại tồn kho sản phẩm (Hoàn kho)
      for (const it of data.items) {
        if (it.productId) {
          await tx.product.update({
            where: { id: it.productId },
            data: {
              stockQuantity: {
                increment: Number(it.quantity)
              }
            }
          });
        }
      }

      // 3. Xử lý giá trị đơn hàng và công nợ
      const currentAdj = Number(order.adjustedAmount) || 0;
      const newAdj = currentAdj - totalReturnAmount; // Ghi nhận giảm trừ
      const baseAmount = Number(order.subtotal) + Number(order.vatAmount);
      const newTotalAmount = Math.max(0, baseAmount + newAdj);
      let paid = Number(order.paidAmount);
      let newRemaining = Math.max(0, newTotalAmount - paid);

      let createdPaymentVoucher = null;

      if (data.refundMethod === 'CREDIT_BALANCE') {
        // Cộng vào số dư trả trước của khách hàng
        await tx.customer.update({
          where: { id: order.customerId },
          data: { creditBalance: { increment: totalReturnAmount } }
        });
      } else if (data.refundMethod === 'CASH_REFUND') {
        // Tự động lập phiếu chi hoàn tiền
        const pvCount = await tx.paymentVoucher.count();
        const pvCode = `PC-${new Date().getFullYear()}-${String(pvCount + 1).padStart(4, '0')}`;
        createdPaymentVoucher = await tx.paymentVoucher.create({
          data: {
            code: pvCode,
            voucherDate: new Date(),
            recipient: order.customer.name,
            phone: order.phone || order.customer.phone,
            address: order.deliveryAddress || order.customer.address,
            reason: `Chi hoàn tiền trả hàng cho đơn ${order.code} (Phiếu ${returnCode}): ${data.reason}`,
            amount: totalReturnAmount,
            paymentMethod: 'BANK_TRANSFER',
            status: 'APPROVED',
            customerId: order.customerId,
            orderId: order.id,
            createdById: userId || null,
            notes: `Sinh tự động từ Phiếu trả hàng ${returnCode}`
          }
        });
      }

      let paymentStatus = order.paymentStatus;
      if (paid >= newTotalAmount && newTotalAmount > 0) {
        paymentStatus = 'PAID';
      } else if (paid > 0) {
        paymentStatus = 'PARTIAL_PAID';
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          adjustedAmount: newAdj,
          adjustmentReason: `Đổi trả hàng theo phiếu ${returnCode}: -${totalReturnAmount.toLocaleString('vi-VN')} đ`,
          totalAmount: newTotalAmount,
          remainingAmount: newRemaining,
          paymentStatus,
          notes: `${order.notes || ''}\n[TRẢ HÀNG ${returnCode}]: Đã hoàn kho và trừ ${totalReturnAmount.toLocaleString('vi-VN')} đ.`.trim()
        },
        include: {
          customer: true,
          manager: { select: { id: true, fullName: true, code: true } },
          items: true
        }
      });

      return {
        orderReturn,
        order: updatedOrder,
        paymentVoucher: createdPaymentVoucher
      };
    });
  }

  async getOrderReturns(orderId?: string) {
    const where: any = {};
    if (orderId) where.orderId = orderId;

    return prisma.orderReturn.findMany({
      where,
      include: {
        order: {
          select: { id: true, code: true, customer: { select: { id: true, name: true, phone: true } } }
        },
        items: true,
        createdBy: { select: { id: true, fullName: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const ordersService = new OrdersService();
