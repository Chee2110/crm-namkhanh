import { prisma } from '../../config/db';

export async function generateOrderCode(tx?: any): Promise<string> {
  const client = tx || prisma;
  const year = new Date().getFullYear();
  const prefix = `DH-${year}-`;
  const latestOrder = await client.order.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true }
  });

  let nextSeq = 1;
  if (latestOrder?.code) {
    const match = latestOrder.code.match(new RegExp(`^DH-${year}-(\\d+)`));
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  let code = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  while (await client.order.findUnique({ where: { code } })) {
    nextSeq++;
    code = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
  return code;
}

export async function generateOrderReturnCode(tx?: any): Promise<string> {
  const client = tx || prisma;
  const year = new Date().getFullYear();
  const prefix = `TH-${year}-`;
  const latestReturn = await client.orderReturn.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true }
  });

  let nextSeq = 1;
  if (latestReturn?.code) {
    const match = latestReturn.code.match(new RegExp(`^TH-${year}-(\\d+)`));
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  let code = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  while (await client.orderReturn.findUnique({ where: { code } })) {
    nextSeq++;
    code = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
  return code;
}

export async function generatePaymentVoucherCode(tx?: any): Promise<string> {
  const client = tx || prisma;
  const year = new Date().getFullYear();
  const prefix = `PC-${year}-`;
  const latestPV = await client.paymentVoucher.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: 'desc' },
    select: { code: true }
  });

  let nextSeq = 1;
  if (latestPV?.code) {
    const match = latestPV.code.match(new RegExp(`^PC-\\d+-(\\d+)`));
    if (match) {
      nextSeq = parseInt(match[1], 10) + 1;
    }
  }

  let code = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  while (await client.paymentVoucher.findUnique({ where: { code } })) {
    nextSeq++;
    code = `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }
  return code;
}

async function findProduct(tx: any, productId?: string | null, productCode?: string | null) {
  if (productId) {
    const prod = await tx.product.findUnique({ where: { id: productId } });
    if (prod) return prod;
  }
  if (productCode && productCode !== 'N/A') {
    const prod = await tx.product.findUnique({ where: { code: productCode } });
    if (prod) return prod;
  }
  return null;
}

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
        items: { where: { quantity: { gt: 0 } } },
        returns: {
          include: {
            items: true,
            createdBy: { select: { fullName: true, code: true } }
          },
          orderBy: { createdAt: 'desc' }
        },
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
          where: { quantity: { gt: 0 } },
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

    const code = await generateOrderCode();

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

      // Chuẩn hóa productId cho computedItems nếu chưa có
      const finalItems = await Promise.all(
        computedItems.map(async (item) => {
          let pid = item.productId;
          if (!pid) {
            const prod = await findProduct(tx, null, item.productCode);
            if (prod) pid = prod.id;
          }
          return { ...item, productId: pid };
        })
      );

      const newOrder = await tx.order.create({
        data: {
          code,
          customerId: data.customerId,
          quotationId: data.quotationId || null,
          managerId: creatorId || null,
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
            create: finalItems
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

      // Tự động trừ tồn kho cho tất cả đơn hàng mới tạo (trừ khi tạo ở trạng thái ĐÃ HỦY - CANCELLED)
      if (data.deliveryStatus !== 'CANCELLED') {
        for (const item of finalItems) {
          const product = await findProduct(tx, item.productId, item.productCode);
          if (product) {
            await tx.product.update({
              where: { id: product.id },
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

    const hasItemsUpdate = data.items && Array.isArray(data.items) && data.items.length > 0;
    const targetDeliveryStatus = data.deliveryStatus || order.deliveryStatus;

    const updateData: any = {
      deliveryAddress: data.deliveryAddress !== undefined ? data.deliveryAddress : order.deliveryAddress,
      contactPerson: data.contactPerson !== undefined ? data.contactPerson : order.contactPerson,
      phone: data.phone !== undefined ? data.phone : order.phone,
      invoiceStatus: data.invoiceStatus !== undefined ? data.invoiceStatus : order.invoiceStatus,
      notes: data.notes !== undefined ? data.notes : order.notes,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : order.deliveryDate
    };

    if (data.customerId) updateData.customerId = data.customerId;
    if (data.quotationId !== undefined) updateData.quotationId = data.quotationId || null;
    if (data.orderDate) updateData.orderDate = new Date(data.orderDate);
    if (data.deliveryStatus) updateData.deliveryStatus = data.deliveryStatus;

    let computedItems: any[] = [];
    if (hasItemsUpdate) {
      let subtotal = 0;
      const vatRate = data.vatRate !== undefined ? Number(data.vatRate) : order.vatRate;

      computedItems = data.items.map((item: any) => {
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
      const paidAmount = data.paidAmount !== undefined ? Number(data.paidAmount) : Number(order.paidAmount);
      const remainingAmount = Math.max(0, totalAmount - paidAmount);

      updateData.subtotal = subtotal;
      updateData.vatRate = vatRate;
      updateData.vatAmount = vatAmount;
      updateData.totalAmount = totalAmount;
      updateData.paidAmount = paidAmount;
      updateData.remainingAmount = remainingAmount;

      if (data.paymentStatus) {
        updateData.paymentStatus = data.paymentStatus;
      } else if (paidAmount >= totalAmount && totalAmount > 0) {
        updateData.paymentStatus = 'PAID';
      } else if (paidAmount > 0) {
        updateData.paymentStatus = 'PARTIAL_PAID';
      } else {
        updateData.paymentStatus = 'UNPAID';
      }
    } else {
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
    }

    return prisma.$transaction(async (tx: any) => {
      // ==============================================================
      // QUẢN LÝ ĐỒNG BỘ KHO VÀ ĐỘ LỆCH TỒN KHO DELTA (Δ)
      // ==============================================================
      if (hasItemsUpdate) {
        // Chuẩn hóa productId cho computedItems nếu chưa có
        const resolvedComputedItems = await Promise.all(
          computedItems.map(async (ci) => {
            let pid = ci.productId;
            if (!pid) {
              const p = await findProduct(tx, null, ci.productCode);
              if (p) pid = p.id;
            }
            return { ...ci, productId: pid };
          })
        );

        const wasCancelled = order.deliveryStatus === 'CANCELLED';
        const isCancelled = targetDeliveryStatus === 'CANCELLED';

        if (!wasCancelled && !isCancelled) {
          // Trường hợp 1: Đơn hàng đang hoạt động -> tiếp tục hoạt động, tính delta số lượng cho từng mặt hàng
          // A. Duyệt các mặt hàng mới / cập nhật
          for (const newItem of resolvedComputedItems) {
            const prod = await findProduct(tx, newItem.productId, newItem.productCode);
            const matchedOld = order.items.find(
              (oi) => (prod && oi.productId === prod.id) || (oi.productId && oi.productId === newItem.productId) || oi.productCode === newItem.productCode
            );
            const oldQty = matchedOld ? Number(matchedOld.quantity) : 0;
            const newQty = Number(newItem.quantity) || 0;
            const delta = newQty - oldQty;

            if (prod && delta !== 0) {
              if (delta > 0) {
                // Tăng số lượng (Δ > 0): Trừ thêm tồn kho
                await tx.product.update({
                  where: { id: prod.id },
                  data: { stockQuantity: { decrement: delta } }
                });
              } else {
                // Giảm số lượng (Δ < 0): Hoàn trả lại vào tồn kho
                await tx.product.update({
                  where: { id: prod.id },
                  data: { stockQuantity: { increment: Math.abs(delta) } }
                });
              }
            }
          }

          // B. Duyệt các mặt hàng cũ đã bị xóa khỏi đơn hàng
          for (const oldItem of order.items) {
            const stillExists = resolvedComputedItems.some(
              (ci) => (oldItem.productId && ci.productId === oldItem.productId) || ci.productCode === oldItem.productCode
            );
            if (!stillExists) {
              // Hoàn trả số lượng của sản phẩm bị xóa về kho
              const prod = await findProduct(tx, oldItem.productId, oldItem.productCode);
              if (prod) {
                await tx.product.update({
                  where: { id: prod.id },
                  data: { stockQuantity: { increment: Number(oldItem.quantity) || 0 } }
                });
              }
            }
          }
        } else if (!wasCancelled && isCancelled) {
          // Trường hợp 2: Đơn hàng chuyển sang ĐÃ HỦY -> hoàn lại toàn bộ tồn kho của đơn cũ
          for (const oldItem of order.items) {
            const prod = await findProduct(tx, oldItem.productId, oldItem.productCode);
            if (prod) {
              await tx.product.update({
                where: { id: prod.id },
                data: { stockQuantity: { increment: Number(oldItem.quantity) || 0 } }
              });
            }
          }
        } else if (wasCancelled && !isCancelled) {
          // Trường hợp 3: Đơn hàng từ ĐÃ HỦY kích hoạt lại -> trừ tồn kho theo danh sách items mới
          for (const newItem of resolvedComputedItems) {
            const prod = await findProduct(tx, newItem.productId, newItem.productCode);
            if (prod) {
              await tx.product.update({
                where: { id: prod.id },
                data: { stockQuantity: { decrement: Number(newItem.quantity) || 0 } }
              });
            }
          }
        }

        // Xóa items cũ và tạo items mới
        await tx.orderItem.deleteMany({ where: { orderId: id } });
        updateData.items = { create: resolvedComputedItems };
      } else {
        // Không sửa items, chỉ thay đổi trạng thái đơn hàng (ví dụ đổi trực tiếp trên bảng danh sách)
        if (data.deliveryStatus && data.deliveryStatus !== order.deliveryStatus) {
          const wasCancelled = order.deliveryStatus === 'CANCELLED';
          const isCancelled = data.deliveryStatus === 'CANCELLED';

          if (!wasCancelled && isCancelled) {
            // Chuyển sang CANCELLED: hoàn lại toàn bộ số lượng trong đơn về kho
            for (const item of order.items) {
              const prod = await findProduct(tx, item.productId, item.productCode);
              if (prod) {
                await tx.product.update({
                  where: { id: prod.id },
                  data: { stockQuantity: { increment: Number(item.quantity) || 0 } }
                });
              }
            }
          } else if (wasCancelled && !isCancelled) {
            // Khôi phục từ CANCELLED: trừ lại tồn kho theo danh sách trong đơn
            for (const item of order.items) {
              const prod = await findProduct(tx, item.productId, item.productCode);
              if (prod) {
                await tx.product.update({
                  where: { id: prod.id },
                  data: { stockQuantity: { decrement: Number(item.quantity) || 0 } }
                });
              }
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
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    return prisma.$transaction(async (tx: any) => {
      // 1. Nếu đơn hàng chưa ở trạng thái ĐÃ HỦY (!== CANCELLED), tự động hoàn trả lại số lượng tồn kho
      if (order.deliveryStatus !== 'CANCELLED') {
        for (const item of order.items) {
          const prod = await findProduct(tx, item.productId, item.productCode);
          if (prod) {
            await tx.product.update({
              where: { id: prod.id },
              data: { stockQuantity: { increment: Number(item.quantity) || 0 } }
            });
          }
        }
      }

      // 2. Gỡ liên kết và dọn dẹp các bảng phụ thuộc
      await tx.orderItem.deleteMany({ where: { orderId: id } });
      await tx.orderHandoverHistory.deleteMany({ where: { orderId: id } });
      await tx.orderReturn.deleteMany({ where: { orderId: id } });
      await tx.receiptVoucherAllocation.deleteMany({ where: { orderId: id } });

      return tx.order.delete({ where: { id } });
    });
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
      // Nếu đơn hàng chưa ở trạng thái ĐÃ HỦY -> Hoàn trả tồn kho lại cho kho
      if (order.deliveryStatus !== 'CANCELLED') {
        for (const item of order.items) {
          const prod = await findProduct(tx, item.productId, item.productCode);
          if (prod) {
            await tx.product.update({
              where: { id: prod.id },
              data: {
                stockQuantity: {
                  increment: Number(item.quantity) || 0
                }
              }
            });
          }
        }
      }

      let createdPaymentVoucher = null;

      if (paid > 0) {
        // Luôn tự động tạo Phiếu chi hoàn tiền trực tiếp cho khách hàng (không lưu vào số dư đơn sau)
        const pvCode = await generatePaymentVoucherCode(tx);

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
            notes: 'Tự động tạo từ quy trình Hủy đơn hàng hoàn tiền cho khách'
          }
        });
      }

      // Cập nhật trạng thái đơn hàng
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          deliveryStatus: 'CANCELLED',
          paymentStatus: paid > 0 ? 'REFUNDED' : 'UNPAID',
          refundAmount: paid,
          remainingAmount: 0,
          notes: `${order.notes || ''}\n[ĐÃ HỦY ĐƠN]: ${refundReason || 'Khách hủy đơn'}. Hoàn tiền: ${paid.toLocaleString('vi-VN')} đ qua Phiếu chi hoàn tiền cho khách.`.trim()
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
      reason?: string;
      returnReason?: string;
      refundMethod?: 'DEDUCT_DEBT' | 'CASH_REFUND' | 'CREDIT_BALANCE';
      refundOption?: 'DEDUCT_DEBT' | 'CASH_REFUND' | 'CREDIT_BALANCE';
      items: Array<{
        orderItemId?: string;
        productId?: string;
        productCode: string;
        productName: string;
        unit: string;
        quantity: number;
        unitPrice: number;
        condition?: 'GOOD' | 'DEFECTIVE';
      }>;
    },
    userId?: string
  ) {
    const reasonText = (data.reason || data.returnReason || '').trim();
    if (!reasonText) {
      throw new Error('Vui lòng nhập lý do trả hàng');
    }
    const refundMethod = data.refundMethod || data.refundOption || 'DEDUCT_DEBT';

    if (!data.items || data.items.length === 0) {
      throw new Error('Phiếu trả hàng phải có ít nhất 1 sản phẩm hoàn trả');
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, items: true }
    });
    if (!order) throw new Error('Không tìm thấy đơn hàng');

    // 1. Kiểm tra điều kiện hoàn: Số lượng trả không được vượt quá số lượng trong đơn
    for (const it of data.items) {
      const matchingOrderItem = order.items.find(
        (oi) =>
          (it.orderItemId && oi.id === it.orderItemId) ||
          (it.productId && oi.productId === it.productId) ||
          oi.productCode === it.productCode
      );
      if (matchingOrderItem && Number(it.quantity) > Number(matchingOrderItem.quantity)) {
        throw new Error(
          `Số lượng trả lại của "${it.productName}" (${it.quantity}) vượt quá số lượng trong đơn hàng (${matchingOrderItem.quantity})`
        );
      }
    }

    // 2. Tính toán tiền hoàn hàng: Subtotal + VAT tương ứng thuế suất của đơn hàng
    const vatRate = Number(order.vatRate ?? 8);
    const returnSubtotal = data.items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
    const returnVat = (returnSubtotal * vatRate) / 100;
    const totalReturnAmount = returnSubtotal + returnVat;

    if (totalReturnAmount <= 0) {
      throw new Error('Tổng giá trị hàng trả phải lớn hơn 0');
    }

    const returnCode = await generateOrderReturnCode();

    return prisma.$transaction(async (tx: any) => {
      // 1. Tạo bản ghi Phiếu trả hàng
      const resolvedReturnItems = await Promise.all(
        data.items.map(async (it) => {
          const prod = await findProduct(tx, it.productId, it.productCode);
          return {
            productId: prod?.id || it.productId || null,
            productCode: it.productCode,
            productName: it.productName,
            unit: it.unit,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            amount: Number(it.quantity) * Number(it.unitPrice)
          };
        })
      );

      const orderReturn = await tx.orderReturn.create({
        data: {
          code: returnCode,
          orderId,
          returnDate: data.returnDate ? new Date(data.returnDate) : new Date(),
          reason: reasonText,
          totalRefundAmount: totalReturnAmount,
          refundMethod,
          status: 'COMPLETED',
          createdById: userId || null,
          items: {
            create: resolvedReturnItems
          }
        },
        include: {
          items: true,
          createdBy: { select: { fullName: true, code: true } }
        }
      });

      // 2. Nhận hàng & cập nhật kho: Hoàn trả lại tồn kho vào kho (Product.stockQuantity)
      let returnedGoodCount = 0;
      let returnedDefectiveCount = 0;
      for (const it of data.items) {
        const isDefective = it.condition === 'DEFECTIVE';
        const returnQty = Number(it.quantity) || 0;
        if (isDefective) {
          returnedDefectiveCount += returnQty;
        } else {
          returnedGoodCount += returnQty;
        }

        if (returnQty > 0) {
          const prod = await findProduct(tx, it.productId, it.productCode);
          if (prod) {
            await tx.product.update({
              where: { id: prod.id },
              data: {
                stockQuantity: {
                  increment: returnQty
                }
              }
            });
          }
        }
      }

      // 3. Tự động cập nhật giảm số lượng mặt hàng trực tiếp trên Đơn hàng (OrderItem)
      for (const it of data.items) {
        const returnQty = Number(it.quantity) || 0;
        if (returnQty <= 0) continue;

        const matchingOrderItem = order.items.find(
          (oi) =>
            (it.orderItemId && oi.id === it.orderItemId) ||
            (it.productId && oi.productId === it.productId) ||
            oi.productCode === it.productCode
        );

        if (matchingOrderItem) {
          const newQty = Math.max(0, Number(matchingOrderItem.quantity) - returnQty);
          if (newQty <= 0) {
            // Nếu hoàn trả sản phẩm về 0 thì tự động xóa dòng hàng hóa đó khỏi đơn hàng
            await tx.orderItem.delete({
              where: { id: matchingOrderItem.id }
            });
          } else {
            const itemPrice = Number(matchingOrderItem.unitPrice);
            const itemVatRate = Number(matchingOrderItem.vatRate ?? vatRate);
            const newAmount = newQty * itemPrice;
            const newTotal = newAmount * (1 + itemVatRate / 100);

            await tx.orderItem.update({
              where: { id: matchingOrderItem.id },
              data: {
                quantity: newQty,
                amount: newAmount,
                total: newTotal
              }
            });
          }
        }
      }

      // 4. Tính toán lại giá trị tài chính của Đơn hàng sau khi đã cập nhật số lượng items
      const allUpdatedItems = await tx.orderItem.findMany({
        where: { orderId }
      });

      const newSubtotal = allUpdatedItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
      const newVatAmount = (newSubtotal * vatRate) / 100;
      const existingAdj = Number(order.adjustedAmount) || 0;
      const newTotalAmount = Math.max(0, newSubtotal + newVatAmount + existingAdj);

      let paid = Number(order.paidAmount);
      let newPaid = paid;
      let newRefund = Number(order.refundAmount) || 0;

      let createdPaymentVoucher = null;

      if (refundMethod === 'CREDIT_BALANCE' || refundMethod === 'CASH_REFUND') {
        // Tự động lập phiếu chi hoàn tiền trực tiếp cho khách hàng (không giữ lại số dư cho đơn sau)
        newPaid = Math.max(0, paid - totalReturnAmount);
        newRefund += totalReturnAmount;
        const pvCode = await generatePaymentVoucherCode(tx);
        createdPaymentVoucher = await tx.paymentVoucher.create({
          data: {
            code: pvCode,
            voucherDate: new Date(),
            recipient: order.customer.name,
            phone: order.phone || order.customer.phone,
            address: order.deliveryAddress || order.customer.address,
            reason: `Chi hoàn tiền trả hàng cho đơn ${order.code} (Phiếu ${returnCode}): ${reasonText}`,
            amount: totalReturnAmount,
            paymentMethod: 'BANK_TRANSFER',
            status: 'APPROVED',
            customerId: order.customerId,
            orderId: order.id,
            createdById: userId || null,
            notes: `Sinh tự động từ Phiếu trả hàng ${returnCode}`
          }
        });
      } else if (refundMethod === 'DEDUCT_DEBT' && paid > newTotalAmount) {
        // Nếu cấn trừ công nợ nhưng tiền đã thu vượt quá giá trị đơn còn lại -> Hoàn phần chênh lệch
        const excess = paid - newTotalAmount;
        newPaid = newTotalAmount;
        newRefund += excess;
        const pvCode = await generatePaymentVoucherCode(tx);
        createdPaymentVoucher = await tx.paymentVoucher.create({
          data: {
            code: pvCode,
            voucherDate: new Date(),
            recipient: order.customer.name,
            phone: order.phone || order.customer.phone,
            address: order.deliveryAddress || order.customer.address,
            reason: `Hoàn tiền thừa sau khi trả hàng đơn ${order.code} (Phiếu ${returnCode}): ${reasonText}`,
            amount: excess,
            paymentMethod: 'BANK_TRANSFER',
            status: 'APPROVED',
            customerId: order.customerId,
            orderId: order.id,
            createdById: userId || null,
            notes: `Sinh tự động từ Phiếu trả hàng ${returnCode} (tiền cọc vượt quá giá trị đơn sau khi trả hàng)`
          }
        });
      }

      const newRemaining = Math.max(0, newTotalAmount - newPaid);

      let paymentStatus = 'UNPAID';
      if (newPaid >= newTotalAmount && newTotalAmount > 0) {
        paymentStatus = 'PAID';
      } else if (newPaid > 0) {
        paymentStatus = 'PARTIAL_PAID';
      }

      const conditionNote = returnedDefectiveCount > 0
        ? ` (Tái nhập: ${returnedGoodCount}, Lỗi cách ly: ${returnedDefectiveCount})`
        : ` (Tái nhập kho: ${returnedGoodCount})`;

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal: newSubtotal,
          vatAmount: newVatAmount,
          totalAmount: newTotalAmount,
          paidAmount: newPaid,
          remainingAmount: newRemaining,
          refundAmount: newRefund,
          paymentStatus,
          notes: `${order.notes || ''}\n[TRẢ HÀNG ${returnCode}]: Đã hoàn kho${conditionNote}, tự động cập nhật giảm số lượng trên đơn và trừ ${totalReturnAmount.toLocaleString('vi-VN')} đ (${refundMethod === 'DEDUCT_DEBT' ? 'Trừ công nợ' : 'Chi hoàn tiền cho khách'}).`.trim()
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
