import { prisma } from '../../config/db';
import { Prisma } from '@prisma/client';

export interface InboundReceiptItemInput {
  productId?: string | null;
  productCode: string;
  productName: string;
  unit: string;
  expectedQuantity: number;
  actualQuantity: number;
  acceptedQuantity: number;
  rejectedQuantity?: number;
  unitPrice: number;
  amount?: number;
  vatRate?: number;
  total?: number;
  batchNumber?: string | null;
  productionDate?: string | null;
  expiryDate?: string | null;
  locationArea?: string | null;
  locationRack?: string | null;
  locationShelf?: string | null;
  locationBin?: string | null;
  qualityStatus?: string;
  qualityNotes?: string | null;
}

export interface CreateInboundReceiptDTO {
  code?: string;
  receiptDate?: string;
  type?: string; // PURCHASE, FINISHED_GOODS, RETURN, ADJUSTMENT
  warehouseId: string;
  supplierId?: string | null;
  sourceName?: string | null;
  documentNumber?: string | null;
  documentDate?: string | null;
  status?: string;
  vatRate?: number;
  notes?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  items: InboundReceiptItemInput[];
}

export class InboundReceiptsService {
  /**
   * Tìm sản phẩm tương ứng trong kho theo productId, mã SKU (không phân biệt hoa/thường) hoặc tên sản phẩm
   */
  private async findMatchingProduct(
    tx: Prisma.TransactionClient,
    item: { productId?: string | null; productCode?: string | null; productName?: string | null }
  ) {
    if (item.productId) {
      const byId = await tx.product.findUnique({ where: { id: item.productId } });
      if (byId) return byId;
    }
    const cleanCode = item.productCode?.trim();
    if (cleanCode && cleanCode !== 'N/A' && cleanCode !== 'SKU-NEW') {
      const byCode = await tx.product.findFirst({
        where: { code: { equals: cleanCode, mode: 'insensitive' } }
      });
      if (byCode) return byCode;
    }
    const cleanName = item.productName?.trim();
    if (cleanName) {
      const byName = await tx.product.findFirst({
        where: { name: { equals: cleanName, mode: 'insensitive' } }
      });
      if (byName) return byName;
    }
    return null;
  }

  /**
   * Sinh mã phiếu nhập tự động: PNK-YYYY-XXXX (ví dụ: PNK-2026-0001)
   */
  async getNextCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PNK-${year}-`;

    const lastReceipt = await prisma.inboundReceipt.findFirst({
      where: {
        code: {
          startsWith: prefix
        }
      },
      orderBy: {
        code: 'desc'
      },
      select: { code: true }
    });

    if (!lastReceipt) {
      return `${prefix}0001`;
    }

    const currentNumber = parseInt(lastReceipt.code.replace(prefix, ''), 10);
    const nextNumber = isNaN(currentNumber) ? 1 : currentNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
  }

  /**
   * Danh sách phiếu nhập kho kèm bộ lọc và KPI thống kê
   */
  async getReceipts(params: {
    search?: string;
    type?: string;
    status?: string;
    warehouseId?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: any = {};

    if (params.type && params.type !== 'ALL') {
      where.type = params.type;
    }

    if (params.status && params.status !== 'ALL') {
      where.status = params.status;
    }

    if (params.warehouseId && params.warehouseId !== 'ALL') {
      where.warehouseId = params.warehouseId;
    }

    if (params.supplierId && params.supplierId !== 'ALL') {
      where.supplierId = params.supplierId;
    }

    if (params.startDate || params.endDate) {
      where.receiptDate = {};
      if (params.startDate) {
        where.receiptDate.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        const end = new Date(params.endDate);
        end.setHours(23, 59, 59, 999);
        where.receiptDate.lte = end;
      }
    }

    if (params.search) {
      const s = params.search.trim();
      where.OR = [
        { code: { contains: s, mode: 'insensitive' } },
        { documentNumber: { contains: s, mode: 'insensitive' } },
        { sourceName: { contains: s, mode: 'insensitive' } },
        { supplier: { name: { contains: s, mode: 'insensitive' } } },
        { warehouse: { name: { contains: s, mode: 'insensitive' } } },
        { items: { some: { productName: { contains: s, mode: 'insensitive' } } } },
        { items: { some: { productCode: { contains: s, mode: 'insensitive' } } } },
        { items: { some: { batchNumber: { contains: s, mode: 'insensitive' } } } }
      ];
    }

    const receipts = await prisma.inboundReceipt.findMany({
      where,
      include: {
        warehouse: { select: { id: true, code: true, name: true } },
        supplier: { select: { id: true, code: true, name: true, phone: true } },
        createdBy: { select: { id: true, fullName: true, code: true } },
        checkedBy: { select: { id: true, fullName: true, code: true } },
        approvedBy: { select: { id: true, fullName: true, code: true } },
        items: true,
        _count: {
          select: { items: true, history: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Tính toán KPI tổng quan
    const allMatching = await prisma.inboundReceipt.findMany({
      where,
      select: {
        status: true,
        totalAmount: true,
        items: {
          select: { actualQuantity: true, acceptedQuantity: true }
        }
      }
    });

    const totalReceipts = allMatching.length;
    const pendingReceipts = allMatching.filter((r) => r.status === 'DRAFT' || r.status === 'CHECKING').length;
    const approvedReceipts = allMatching.filter((r) => r.status === 'APPROVED').length;
    const rejectedReceipts = allMatching.filter((r) => r.status === 'REJECTED').length;
    const totalValue = allMatching
      .filter((r) => r.status === 'APPROVED')
      .reduce((sum, r) => sum + Number(r.totalAmount || 0), 0);
    const totalItemsAccepted = allMatching
      .filter((r) => r.status === 'APPROVED')
      .reduce((sum, r) => sum + r.items.reduce((s2, it) => s2 + it.acceptedQuantity, 0), 0);

    return {
      kpis: {
        totalReceipts,
        pendingReceipts,
        approvedReceipts,
        rejectedReceipts,
        totalValue,
        totalItemsAccepted
      },
      receipts
    };
  }

  /**
   * Lấy chi tiết một phiếu nhập kho
   */
  async getReceiptById(id: string) {
    const receipt = await prisma.inboundReceipt.findUnique({
      where: { id },
      include: {
        warehouse: true,
        supplier: true,
        createdBy: { select: { id: true, fullName: true, code: true, email: true, phone: true } },
        checkedBy: { select: { id: true, fullName: true, code: true, email: true } },
        approvedBy: { select: { id: true, fullName: true, code: true, email: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                code: true,
                name: true,
                stockQuantity: true,
                minStockLevel: true,
                costPrice: true,
                sellingPrice: true,
                imageUrl: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        history: {
          include: {
            performedBy: {
              select: { id: true, fullName: true, code: true }
            }
          },
          orderBy: { performedAt: 'desc' }
        }
      }
    });

    if (!receipt) {
      throw new Error(`Không tìm thấy phiếu nhập kho với ID: ${id}`);
    }

    return receipt;
  }

  /**
   * Tạo mới phiếu nhập kho
   */
  async createReceipt(data: CreateInboundReceiptDTO, currentUserId: string) {
    const code = data.code?.trim() || (await this.getNextCode());

    // Kiểm tra trùng mã
    const existing = await prisma.inboundReceipt.findUnique({ where: { code } });
    if (existing) {
      throw new Error(`Mã phiếu nhập kho "${code}" đã tồn tại trên hệ thống`);
    }

    // Kiểm tra kho hợp lệ
    const warehouse = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
    if (!warehouse) {
      throw new Error('Kho lưu trữ không tồn tại hoặc đã bị xóa');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('Vui lòng chọn ít nhất một mặt hàng/nguyên vật liệu cần nhập kho');
    }

    // Tính toán tiền hàng
    let subtotal = 0;
    const vatRate = Number(data.vatRate) || 0;

    // Tự động tìm và liên kết với sản phẩm cũ trong kho nếu có mã code tương ứng
    const productCodesToMatch = data.items
      .filter((i) => !i.productId && i.productCode && i.productCode.trim() !== 'N/A')
      .map((i) => i.productCode.trim());

    let existingProductsByCode: Record<string, string> = {};
    if (productCodesToMatch.length > 0) {
      const foundProds = await prisma.product.findMany({
        where: { code: { in: productCodesToMatch } },
        select: { id: true, code: true }
      });
      foundProds.forEach((p) => {
        existingProductsByCode[p.code] = p.id;
      });
    }

    const formattedItems = data.items.map((item) => {
      const expQty = Math.max(0, Number(item.expectedQuantity) || 1);
      const actQty = Math.max(0, Number(item.actualQuantity) !== undefined ? Number(item.actualQuantity) : expQty);
      const accQty = Math.max(0, Number(item.acceptedQuantity) !== undefined ? Number(item.acceptedQuantity) : actQty);
      const rejQty = Math.max(0, Number(item.rejectedQuantity) || 0);
      const unitPrice = Math.max(0, Number(item.unitPrice) || 0);

      // Thành tiền tính theo số lượng thực tế nhận được (hoặc số lượng chấp nhận)
      const qtyForAmount = accQty > 0 ? accQty : actQty;
      const amount = qtyForAmount * unitPrice;
      const itemVat = Number(item.vatRate) || vatRate;
      const total = amount + (amount * itemVat) / 100;

      subtotal += amount;

      const pCode = item.productCode?.trim() || 'N/A';
      const resolvedProductId = item.productId || (pCode !== 'N/A' ? existingProductsByCode[pCode] || null : null);

      return {
        productId: resolvedProductId,
        productCode: pCode,
        productName: item.productName?.trim() || 'Hàng hóa',
        unit: item.unit?.trim() || 'Cái',
        expectedQuantity: expQty,
        actualQuantity: actQty,
        acceptedQuantity: accQty,
        rejectedQuantity: rejQty,
        unitPrice: new Prisma.Decimal(unitPrice),
        amount: new Prisma.Decimal(amount),
        vatRate: itemVat,
        total: new Prisma.Decimal(total),
        batchNumber: item.batchNumber?.trim() || null,
        productionDate: item.productionDate ? new Date(item.productionDate) : null,
        expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
        locationArea: item.locationArea?.trim() || null,
        locationRack: item.locationRack?.trim() || null,
        locationShelf: item.locationShelf?.trim() || null,
        locationBin: item.locationBin?.trim() || null,
        qualityStatus: item.qualityStatus || 'PASSED',
        qualityNotes: item.qualityNotes?.trim() || null
      };
    });

    const vatAmount = (subtotal * vatRate) / 100;
    const totalAmount = subtotal + vatAmount;

    return await prisma.$transaction(async (tx) => {
      const receipt = await tx.inboundReceipt.create({
        data: {
          code,
          receiptDate: data.receiptDate ? new Date(data.receiptDate) : new Date(),
          type: data.type || 'PURCHASE',
          warehouseId: data.warehouseId,
          supplierId: data.supplierId || null,
          sourceName: data.sourceName?.trim() || null,
          documentNumber: data.documentNumber?.trim() || null,
          documentDate: data.documentDate ? new Date(data.documentDate) : null,
          status: data.status || 'DRAFT',
          subtotal: new Prisma.Decimal(subtotal),
          vatRate,
          vatAmount: new Prisma.Decimal(vatAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          notes: data.notes?.trim() || null,
          fileUrl: data.fileUrl || null,
          fileName: data.fileName || null,
          createdById: currentUserId,
          items: {
            create: formattedItems
          }
        },
        include: {
          warehouse: true,
          supplier: true,
          items: true
        }
      });

      // Ghi lịch sử tạo phiếu
      await tx.inboundReceiptHistory.create({
        data: {
          receiptId: receipt.id,
          action: 'CREATE',
          title: 'Tạo mới phiếu nhập kho',
          description: `Lập phiếu nhập kho ${receipt.code} với ${receipt.items.length} mặt hàng, tổng tiền ${totalAmount.toLocaleString('vi-VN')} đ`,
          performedById: currentUserId
        }
      });

      return receipt;
    });
  }

  /**
   * Cập nhật thông tin phiếu nhập kho (hỗ trợ tất cả trạng thái; nếu đã APPROVED sẽ tự động đồng bộ lại tồn kho theo chênh lệch)
   */
  async updateReceipt(id: string, data: Partial<CreateInboundReceiptDTO>, currentUserId: string) {
    const existing = await prisma.inboundReceipt.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existing) {
      throw new Error(`Không tìm thấy phiếu nhập kho với ID: ${id}`);
    }

    const updateData: any = {};
    if (data.code && data.code.trim() && data.code.trim() !== existing.code) {
      const duplicate = await prisma.inboundReceipt.findUnique({ where: { code: data.code.trim() } });
      if (duplicate) {
        throw new Error(`Mã phiếu nhập kho "${data.code.trim()}" đã tồn tại trên hệ thống`);
      }
      updateData.code = data.code.trim();
    }
    if (data.receiptDate) updateData.receiptDate = new Date(data.receiptDate);
    if (data.type) updateData.type = data.type;
    if (data.warehouseId) updateData.warehouseId = data.warehouseId;
    if (data.supplierId !== undefined) updateData.supplierId = data.supplierId || null;
    if (data.sourceName !== undefined) updateData.sourceName = data.sourceName?.trim() || null;
    if (data.documentNumber !== undefined) updateData.documentNumber = data.documentNumber?.trim() || null;
    if (data.documentDate !== undefined) updateData.documentDate = data.documentDate ? new Date(data.documentDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
    if (data.fileUrl !== undefined) updateData.fileUrl = data.fileUrl;
    if (data.fileName !== undefined) updateData.fileName = data.fileName;

    // Giữ nguyên trạng thái APPROVED nếu phiếu đã duyệt (trừ khi truyền trạng thái cụ thể)
    const targetStatus = existing.status === 'APPROVED' ? 'APPROVED' : (data.status || existing.status);
    updateData.status = targetStatus;

    return await prisma.$transaction(async (tx) => {
      let stockSyncDiffSummary = '';

      // Nếu có cập nhật danh sách mặt hàng
      if (data.items && Array.isArray(data.items)) {
        // 1. Ghi nhận số lượng cũ theo từng sản phẩm (nếu phiếu cũ đã ở trạng thái APPROVED)
        const oldQtyByProduct = new Map<string, { qty: number; name: string; unit: string }>();
        if (existing.status === 'APPROVED') {
          for (const oldItem of existing.items) {
            const oldQty = oldItem.acceptedQuantity > 0 ? oldItem.acceptedQuantity : oldItem.actualQuantity;
            if (oldQty > 0) {
              const oldProd = await this.findMatchingProduct(tx, oldItem);
              if (oldProd) {
                const prev = oldQtyByProduct.get(oldProd.id);
                oldQtyByProduct.set(oldProd.id, {
                  qty: (prev?.qty || 0) + oldQty,
                  name: oldItem.productName || oldProd.name,
                  unit: oldItem.unit || oldProd.unit
                });
              }
            }
          }
        }

        // 2. Xóa items cũ và tạo items mới
        await tx.inboundReceiptItem.deleteMany({ where: { receiptId: id } });

        let subtotal = 0;
        const vatRate = data.vatRate !== undefined ? Number(data.vatRate) : existing.vatRate;

        const formattedItems: any[] = [];
        for (const item of data.items) {
          const expQty = Math.max(0, Number(item.expectedQuantity) || 1);
          const actQty = Math.max(0, Number(item.actualQuantity) !== undefined ? Number(item.actualQuantity) : expQty);
          const accQty = Math.max(0, Number(item.acceptedQuantity) !== undefined ? Number(item.acceptedQuantity) : actQty);
          const rejQty = Math.max(0, Number(item.rejectedQuantity) || 0);
          const unitPrice = Math.max(0, Number(item.unitPrice) || 0);

          const qtyForAmount = accQty > 0 ? accQty : actQty;
          const amount = qtyForAmount * unitPrice;
          const itemVat = Number(item.vatRate) || vatRate;
          const total = amount + (amount * itemVat) / 100;

          subtotal += amount;

          const matchedProd = await this.findMatchingProduct(tx, item);
          const pCode = item.productCode?.trim() || matchedProd?.code || 'N/A';
          const resolvedProductId = matchedProd?.id || item.productId || null;

          formattedItems.push({
            receiptId: id,
            productId: resolvedProductId,
            productCode: pCode,
            productName: item.productName?.trim() || matchedProd?.name || 'Hàng hóa',
            unit: item.unit?.trim() || matchedProd?.unit || 'Cái',
            expectedQuantity: expQty,
            actualQuantity: actQty,
            acceptedQuantity: accQty,
            rejectedQuantity: rejQty,
            unitPrice: new Prisma.Decimal(unitPrice),
            amount: new Prisma.Decimal(amount),
            vatRate: itemVat,
            total: new Prisma.Decimal(total),
            batchNumber: item.batchNumber?.trim() || null,
            productionDate: item.productionDate ? new Date(item.productionDate) : null,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            locationArea: item.locationArea?.trim() || null,
            locationRack: item.locationRack?.trim() || null,
            locationShelf: item.locationShelf?.trim() || null,
            locationBin: item.locationBin?.trim() || null,
            qualityStatus: item.qualityStatus || 'PASSED',
            qualityNotes: item.qualityNotes?.trim() || null
          });
        }

        await tx.inboundReceiptItem.createMany({ data: formattedItems });

        // 3. Nếu trạng thái là APPROVED (hoặc phiếu cũ đã APPROVED), chỉ cộng/trừ đúng phần chênh lệch (newQty - oldQty) và mặc định cập nhật giá vốn
        if (existing.status === 'APPROVED' || targetStatus === 'APPROVED') {
          const newQtyByProduct = new Map<string, { qty: number; unitPrice: number; name: string; unit: string }>();

          if (targetStatus === 'APPROVED') {
            for (const newItem of formattedItems) {
              const newQty = newItem.acceptedQuantity > 0 ? newItem.acceptedQuantity : newItem.actualQuantity;
              if (newItem.productId && newQty > 0) {
                const prev = newQtyByProduct.get(newItem.productId);
                newQtyByProduct.set(newItem.productId, {
                  qty: (prev?.qty || 0) + newQty,
                  unitPrice: Number(newItem.unitPrice) || prev?.unitPrice || 0,
                  name: newItem.productName,
                  unit: newItem.unit
                });
              }
            }
          }

          const allProductIds = new Set<string>([
            ...Array.from(oldQtyByProduct.keys()),
            ...Array.from(newQtyByProduct.keys())
          ]);

          const diffParts: string[] = [];

          for (const prodId of allProductIds) {
            const oldEntry = oldQtyByProduct.get(prodId);
            const newEntry = newQtyByProduct.get(prodId);
            const oldQty = oldEntry?.qty || 0;
            const newQty = newEntry?.qty || 0;
            const diffQty = newQty - oldQty;

            const prodUpdate: any = {};
            if (diffQty > 0) {
              prodUpdate.stockQuantity = { increment: diffQty };
              diffParts.push(`${newEntry?.name || oldEntry?.name} (+${diffQty})`);
            } else if (diffQty < 0) {
              prodUpdate.stockQuantity = { decrement: Math.abs(diffQty) };
              diffParts.push(`${newEntry?.name || oldEntry?.name} (${diffQty})`);
            }

            // Mặc định luôn cập nhật giá vốn theo đơn giá nhập kho mới nhất
            if (newEntry && newEntry.unitPrice > 0) {
              prodUpdate.costPrice = new Prisma.Decimal(newEntry.unitPrice);
            }

            if (Object.keys(prodUpdate).length > 0) {
              await tx.product.update({
                where: { id: prodId },
                data: prodUpdate
              });
            }
          }

          if (diffParts.length > 0) {
            stockSyncDiffSummary = ` (Đồng bộ chênh lệch tồn kho: ${diffParts.join(', ')})`;
          } else {
            stockSyncDiffSummary = ' (Đã đồng bộ giá vốn & tồn kho)';
          }
        }

        const vatAmount = (subtotal * vatRate) / 100;
        const totalAmount = subtotal + vatAmount;

        updateData.subtotal = new Prisma.Decimal(subtotal);
        updateData.vatRate = vatRate;
        updateData.vatAmount = new Prisma.Decimal(vatAmount);
        updateData.totalAmount = new Prisma.Decimal(totalAmount);
      }

      const updated = await tx.inboundReceipt.update({
        where: { id },
        data: updateData,
        include: {
          warehouse: true,
          supplier: true,
          items: true
        }
      });

      // Ghi lịch sử
      await tx.inboundReceiptHistory.create({
        data: {
          receiptId: id,
          action: 'UPDATE',
          title: 'Cập nhật thông tin phiếu nhập kho',
          description: `Chỉnh sửa thông tin phiếu ${updated.code}${stockSyncDiffSummary}`,
          performedById: currentUserId
        }
      });

      return updated;
    });
  }

  /**
   * Bước 3 trong Quy trình: Kiểm tra thực tế & Đối chiếu chứng từ
   */
  async verifyReceipt(
    id: string,
    data: {
      items: Array<{
        id: string;
        actualQuantity: number;
        acceptedQuantity: number;
        rejectedQuantity?: number;
        qualityStatus: string;
        qualityNotes?: string | null;
        locationArea?: string | null;
        locationRack?: string | null;
        locationShelf?: string | null;
        locationBin?: string | null;
      }>;
      notes?: string;
    },
    currentUserId: string
  ) {
    const receipt = await prisma.inboundReceipt.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!receipt) {
      throw new Error(`Không tìm thấy phiếu nhập kho với ID: ${id}`);
    }

    if (receipt.status === 'APPROVED') {
      throw new Error('Phiếu nhập kho này đã được duyệt và cộng tồn kho');
    }

    return await prisma.$transaction(async (tx) => {
      // Cập nhật từng item
      let newSubtotal = 0;

      for (const inputItem of data.items) {
        const currentItem = receipt.items.find((it) => it.id === inputItem.id);
        if (!currentItem) continue;

        const actualQty = Math.max(0, Number(inputItem.actualQuantity) || 0);
        const acceptedQty = Math.max(0, Number(inputItem.acceptedQuantity) || 0);
        const rejectedQty = Math.max(0, Number(inputItem.rejectedQuantity) || 0);
        const unitPrice = Number(currentItem.unitPrice) || 0;

        const amount = acceptedQty * unitPrice;
        const total = amount + (amount * currentItem.vatRate) / 100;
        newSubtotal += amount;

        await tx.inboundReceiptItem.update({
          where: { id: inputItem.id },
          data: {
            actualQuantity: actualQty,
            acceptedQuantity: acceptedQty,
            rejectedQuantity: rejectedQty,
            qualityStatus: inputItem.qualityStatus || currentItem.qualityStatus,
            qualityNotes: inputItem.qualityNotes !== undefined ? inputItem.qualityNotes : currentItem.qualityNotes,
            locationArea: inputItem.locationArea !== undefined ? inputItem.locationArea : currentItem.locationArea,
            locationRack: inputItem.locationRack !== undefined ? inputItem.locationRack : currentItem.locationRack,
            locationShelf: inputItem.locationShelf !== undefined ? inputItem.locationShelf : currentItem.locationShelf,
            locationBin: inputItem.locationBin !== undefined ? inputItem.locationBin : currentItem.locationBin,
            amount: new Prisma.Decimal(amount),
            total: new Prisma.Decimal(total)
          }
        });
      }

      const vatAmount = (newSubtotal * receipt.vatRate) / 100;
      const totalAmount = newSubtotal + vatAmount;

      const updated = await tx.inboundReceipt.update({
        where: { id },
        data: {
          status: 'CHECKING',
          checkedById: currentUserId,
          checkedAt: new Date(),
          subtotal: new Prisma.Decimal(newSubtotal),
          vatAmount: new Prisma.Decimal(vatAmount),
          totalAmount: new Prisma.Decimal(totalAmount),
          notes: data.notes !== undefined ? data.notes : receipt.notes
        },
        include: {
          items: true,
          warehouse: true,
          supplier: true,
          checkedBy: true
        }
      });

      // Ghi nhận lịch sử kiểm hàng thực tế
      await tx.inboundReceiptHistory.create({
        data: {
          receiptId: id,
          action: 'VERIFY',
          title: 'Kiểm tra thực tế hàng nhận',
          description: `Hoàn tất đối chiếu chứng từ và kiểm tra thực tế hàng nhập. Số mặt hàng kiểm nhận: ${data.items.length}`,
          performedById: currentUserId
        }
      });

      return updated;
    });
  }

  /**
   * Bước 4 & 5: Duyệt phiếu nhập kho & Tự động cập nhật tồn kho
   */
  async approveReceipt(
    id: string,
    currentUserId: string,
    options?: { updateCostPrice?: boolean; notes?: string }
  ) {
    const receipt = await prisma.inboundReceipt.findUnique({
      where: { id },
      include: {
        items: true,
        warehouse: true
      }
    });

    if (!receipt) {
      throw new Error(`Không tìm thấy phiếu nhập kho với ID: ${id}`);
    }

    if (receipt.status === 'APPROVED') {
      throw new Error(`Phiếu nhập kho "${receipt.code}" đã được phê duyệt trước đó`);
    }

    if (receipt.status === 'CANCELLED') {
      throw new Error(`Phiếu nhập kho "${receipt.code}" đã bị hủy, không thể phê duyệt`);
    }

    if (!receipt.items || receipt.items.length === 0) {
      throw new Error('Phiếu nhập kho không có mặt hàng nào để nhập kho');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái phiếu thành APPROVED
      const updatedReceipt = await tx.inboundReceipt.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: currentUserId,
          approvedAt: new Date(),
          notes: options?.notes ? `${receipt.notes ? receipt.notes + ' | ' : ''}${options.notes}` : receipt.notes
        },
        include: {
          items: true,
          warehouse: true,
          supplier: true,
          approvedBy: true
        }
      });

      // 2. Tự động cộng số lượng nhập vào tồn kho (Product.stockQuantity) & mặc định cập nhật giá vốn
      let totalAddedQuantity = 0;
      const updatedProductsSummary: string[] = [];
      const shouldUpdateCostPrice = options?.updateCostPrice !== false;

      for (const item of receipt.items) {
        const qtyToAdd = item.acceptedQuantity > 0 ? item.acceptedQuantity : item.actualQuantity;
        if (qtyToAdd <= 0) continue;

        // Tìm sản phẩm theo productId, mã SKU hoặc tên sản phẩm
        const product = await this.findMatchingProduct(tx, item);

        if (product) {
          if (!item.productId) {
            await tx.inboundReceiptItem.update({
              where: { id: item.id },
              data: { productId: product.id }
            });
          }

          const updateProductData: any = {
            stockQuantity: {
              increment: qtyToAdd
            }
          };

          // Mặc định tự động cập nhật giá vốn theo đơn giá nhập kho này
          if (shouldUpdateCostPrice && Number(item.unitPrice) > 0) {
            updateProductData.costPrice = item.unitPrice;
          }

          // Gán kho mặc định nếu sản phẩm chưa có kho
          if (!product.warehouseId && receipt.warehouseId) {
            updateProductData.warehouseId = receipt.warehouseId;
          }

          await tx.product.update({
            where: { id: product.id },
            data: updateProductData
          });

          totalAddedQuantity += qtyToAdd;
          updatedProductsSummary.push(`${item.productName} (+${qtyToAdd} ${item.unit})`);
        }
      }

      // 3. Ghi nhận lịch sử duyệt phiếu và cập nhật tồn kho
      await tx.inboundReceiptHistory.create({
        data: {
          receiptId: id,
          action: 'APPROVE',
          title: 'Phê duyệt & Tự động cập nhật tồn kho',
          description: `Đã phê duyệt phiếu nhập kho ${receipt.code}. Tự động cộng tồn kho ${totalAddedQuantity} sản phẩm. Chi tiết: ${updatedProductsSummary.slice(0, 5).join(', ')}${updatedProductsSummary.length > 5 ? '...' : ''}`,
          performedById: currentUserId
        }
      });

      // 4. Ghi Audit Log hệ thống
      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'APPROVE',
          entityType: 'InboundReceipt',
          entityId: id,
          newValue: {
            code: receipt.code,
            status: 'APPROVED',
            totalAddedQuantity,
            totalAmount: Number(receipt.totalAmount)
          }
        }
      });

      return updatedReceipt;
    });
  }

  /**
   * Từ chối duyệt phiếu nhập kho
   */
  async rejectReceipt(id: string, reason: string, currentUserId: string) {
    const receipt = await prisma.inboundReceipt.findUnique({ where: { id } });
    if (!receipt) throw new Error('Không tìm thấy phiếu nhập kho');

    if (receipt.status === 'APPROVED') {
      throw new Error('Phiếu nhập đã được duyệt thành công, không thể từ chối');
    }

    const updated = await prisma.inboundReceipt.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedReason: reason.trim()
      }
    });

    await prisma.inboundReceiptHistory.create({
      data: {
        receiptId: id,
        action: 'REJECT',
        title: 'Từ chối duyệt phiếu nhập kho',
        description: `Lý do từ chối: ${reason.trim()}`,
        performedById: currentUserId
      }
    });

    return updated;
  }

  /**
   * Hủy phiếu nhập kho (Nếu phiếu đã duyệt, trừ lại số lượng tồn kho tương ứng)
   */
  async cancelReceipt(id: string, reason: string, currentUserId: string) {
    const receipt = await prisma.inboundReceipt.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!receipt) throw new Error('Không tìm thấy phiếu nhập kho');

    if (receipt.status === 'CANCELLED') {
      throw new Error('Phiếu nhập kho này đã ở trạng thái đã hủy');
    }

    return await prisma.$transaction(async (tx) => {
      // Nếu đã từng duyệt kho, cần hoàn tác trừ lại số lượng tồn kho đã cộng
      if (receipt.status === 'APPROVED') {
        for (const item of receipt.items) {
          const qtyToDeduct = item.acceptedQuantity > 0 ? item.acceptedQuantity : item.actualQuantity;
          if (qtyToDeduct > 0) {
            const product = await this.findMatchingProduct(tx, item);

            if (product) {
              await tx.product.update({
                where: { id: product.id },
                data: {
                  stockQuantity: {
                    decrement: qtyToDeduct
                  }
                }
              });
            }
          }
        }
      }

      const updated = await tx.inboundReceipt.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          rejectedReason: reason.trim()
        }
      });

      await tx.inboundReceiptHistory.create({
        data: {
          receiptId: id,
          action: 'CANCEL',
          title: 'Hủy phiếu nhập kho',
          description: `Đã hủy phiếu nhập kho ${receipt.code}. Lý do: ${reason.trim()}${receipt.status === 'APPROVED' ? ' (Đã hoàn tác trừ lại số lượng tồn kho)' : ''}`,
          performedById: currentUserId
        }
      });

      return updated;
    });
  }

  /**
   * Xóa phiếu nhập kho
   * Nếu phiếu đã duyệt (APPROVED), tự động trừ lại số lượng tồn kho tương ứng
   */
  async deleteReceipt(id: string, currentUserId: string) {
    const receipt = await prisma.inboundReceipt.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!receipt) throw new Error('Không tìm thấy phiếu nhập kho');

    return await prisma.$transaction(async (tx) => {
      // Nếu phiếu đã từng duyệt kho, hoàn tác trừ lại số lượng tồn kho đã cộng
      if (receipt.status === 'APPROVED') {
        for (const item of receipt.items) {
          const qtyToDeduct = item.acceptedQuantity > 0 ? item.acceptedQuantity : item.actualQuantity;
          if (qtyToDeduct > 0) {
            const product = await this.findMatchingProduct(tx, item);

            if (product) {
              await tx.product.update({
                where: { id: product.id },
                data: {
                  stockQuantity: {
                    decrement: qtyToDeduct
                  }
                }
              });
            }
          }
        }
      }

      await tx.inboundReceipt.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          action: 'DELETE',
          entityType: 'InboundReceipt',
          entityId: id,
          oldValue: {
            code: receipt.code,
            status: receipt.status,
            totalAmount: Number(receipt.totalAmount),
            warehouseId: receipt.warehouseId
          }
        }
      });

      return { success: true, message: `Đã xóa phiếu nhập kho ${receipt.code}` };
    });
  }
}

export const inboundReceiptsService = new InboundReceiptsService();
