import { prisma } from '../../config/db';

// Dòng dữ liệu nhập từ file Excel khách hàng (đã được frontend ánh xạ theo tiêu đề cột)
export interface ImportCustomerRow {
  rowNumber?: number;
  code?: string;
  name?: string;
  taxCode?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  contactPhone?: string;
  deliveryAddress?: string;
  manager?: string;
  customerType?: string;
  source?: string;
}

// Chuẩn hóa chuỗi để so khớp: bỏ dấu tiếng Việt, chữ thường, chỉ giữ chữ + số
const normalizeKey = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const cleanText = (value: unknown): string => String(value ?? '').trim();

// SĐT nhập từ Excel dạng số sẽ mất số 0 ở đầu (vd: 912345678) -> bổ sung lại
const normalizePhone = (value: unknown): string => {
  let s = cleanText(value).replace(/[\s.\-()]/g, '');
  if (/^[1-9]\d{8}$/.test(s)) s = `0${s}`;
  return s;
};

// MST 10 số bắt đầu bằng 0 bị Excel cắt mất số 0 -> bổ sung lại
const normalizeTaxCode = (value: unknown): string => {
  let s = cleanText(value).replace(/\s/g, '');
  if (/^\d{9}$/.test(s)) s = `0${s}`;
  return s;
};

const CUSTOMER_TYPE_ALIASES: Record<string, string> = {
  enterprise: 'ENTERPRISE',
  doanhnghiep: 'ENTERPRISE',
  congty: 'ENTERPRISE',
  dn: 'ENTERPRISE',
  school: 'SCHOOL',
  truonghoc: 'SCHOOL',
  truong: 'SCHOOL',
  organization: 'ORGANIZATION',
  coquan: 'ORGANIZATION',
  tochuc: 'ORGANIZATION',
  coquantochuc: 'ORGANIZATION',
  household: 'HOUSEHOLD',
  hokinhdoanh: 'HOUSEHOLD',
  hokd: 'HOUSEHOLD',
  daily: 'HOUSEHOLD',
  dailyhokd: 'HOUSEHOLD',
  dailyhokinhdoanh: 'HOUSEHOLD',
  individual: 'INDIVIDUAL',
  canhan: 'INDIVIDUAL'
};

const SOURCE_ALIASES: Record<string, string> = {
  selffound: 'SELF_FOUND',
  tutimkiem: 'SELF_FOUND',
  tutim: 'SELF_FOUND',
  referral: 'REFERRAL',
  duocgioithieu: 'REFERRAL',
  gioithieu: 'REFERRAL',
  social: 'SOCIAL',
  mangxahoi: 'SOCIAL',
  mangxahoiweb: 'SOCIAL',
  web: 'SOCIAL',
  website: 'SOCIAL',
  facebook: 'SOCIAL',
  exhibition: 'EXHIBITION',
  hoithao: 'EXHIBITION',
  trienlam: 'EXHIBITION',
  hoithaotrienlam: 'EXHIBITION',
  other: 'OTHER',
  khac: 'OTHER'
};

let constraintsRelaxed = false;
export async function ensureCustomerConstraintsRelaxed(): Promise<void> {
  if (constraintsRelaxed) return;
  constraintsRelaxed = true;
  try {
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "customers_phone_key";`);
    await prisma.$executeRawUnsafe(`DROP INDEX IF EXISTS "customers_tax_code_key";`);
  } catch (_) {}
}

export async function generateUniqueCustomerCode(tx?: any, requestedCode?: string): Promise<string> {
  const client = tx || prisma;
  const cleanReq = requestedCode ? String(requestedCode).trim().toUpperCase() : '';
  if (cleanReq) {
    const existing = await client.customer.findUnique({ where: { code: cleanReq } });
    if (!existing) return cleanReq;
  }

  const allCodes = await client.customer.findMany({
    where: { code: { startsWith: 'KH' } },
    select: { code: true }
  });

  let maxSeq = 0;
  for (const c of allCodes) {
    const m = /^KH(\d+)$/i.exec(String(c.code || ''));
    if (m) {
      const seq = parseInt(m[1], 10);
      if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
    }
  }

  let nextSeq = maxSeq + 1;
  let code = `KH${String(nextSeq).padStart(4, '0')}`;
  while (await client.customer.findUnique({ where: { code } })) {
    nextSeq++;
    code = `KH${String(nextSeq).padStart(4, '0')}`;
  }
  return code;
}

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
    minDebt?: number;
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

    if (params.minDebt !== undefined && params.minDebt !== null && !isNaN(Number(params.minDebt))) {
      return mapped.filter((c: any) => c.totalDebt >= Number(params.minDebt));
    }

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
      phone?: string;
      taxCode?: string;
      address?: string;
      deliveryAddress?: string;
      customerType?: string;
      source?: string;
      contactPerson?: string;
      contactPhone?: string;
      email?: string;
      notes?: string;
      managerId?: string;
      status?: string;
      creditLimit?: number | string;
      maxDebtDays?: number | string;
    },
    creatorId: string
  ) {
    await ensureCustomerConstraintsRelaxed();

    const cleanName = String(data.name || '').trim();
    if (!cleanName) {
      throw new Error('Tên khách hàng là bắt buộc');
    }

    const cleanPhone = data.phone ? String(data.phone).trim() : '';
    const cleanContactPhone = data.contactPhone ? String(data.contactPhone).trim() : '';
    const cleanTaxCode = data.taxCode ? String(data.taxCode).trim() : '';

    // Tự sinh mã KH duy nhất nếu chưa có hoặc bị trùng
    const code = await generateUniqueCustomerCode(prisma, data.code);

    const newCustomer = await prisma.customer.create({
      data: {
        code,
        name: cleanName,
        phone: (cleanPhone || null) as any,
        taxCode: cleanTaxCode || null,
        address: data.address || null,
        deliveryAddress: data.deliveryAddress || data.address || null,
        customerType: data.customerType || 'ENTERPRISE',
        source: data.source || 'SELF_FOUND',
        contactPerson: data.contactPerson || null,
        contactPhone: cleanContactPhone || null,
        email: data.email || null,
        notes: data.notes || null,
        managerId: data.managerId || creatorId || null,
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

    try {
      await prisma.auditLog.create({
        data: {
          userId: creatorId,
          action: 'CREATE',
          entityType: 'Customer',
          entityId: newCustomer.id,
          newValue: {
            title: `Khởi tạo hồ sơ khách hàng: ${newCustomer.name}`,
            notes: `Mã: ${newCustomer.code} • Loại: ${newCustomer.customerType}`
          }
        }
      });
    } catch (_) {}

    return newCustomer;
  }

  async updateCustomer(id: string, data: any) {
    await ensureCustomerConstraintsRelaxed();

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new Error('Không tìm thấy khách hàng');

    // Chỉ cập nhật các trường có trong bảng customers (bỏ qua trường phụ trợ của form như contactPosition)
    const allowedFields = [
      'code', 'name', 'phone', 'taxCode', 'address', 'deliveryAddress', 'customerType', 'source',
      'contactPerson', 'contactPhone', 'email', 'notes', 'managerId', 'status', 'creditLimit', 'maxDebtDays'
    ];
    const updateData: any = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    if (updateData.phone !== undefined) {
      const p = String(updateData.phone || '').trim();
      updateData.phone = p ? p : null;
    }
    if (updateData.contactPhone !== undefined) {
      const cp = String(updateData.contactPhone || '').trim();
      updateData.contactPhone = cp ? cp : null;
    }
    if (updateData.taxCode === '') updateData.taxCode = null;
    if (updateData.managerId === '') updateData.managerId = null;
    if (data.creditLimit !== undefined) {
      updateData.creditLimit = Number(data.creditLimit);
    }
    if (data.maxDebtDays !== undefined) {
      updateData.maxDebtDays = Number(data.maxDebtDays);
    }

    const updated = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        manager: {
          select: { id: true, fullName: true, code: true, email: true }
        }
      }
    });

    try {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'Customer',
          entityId: id,
          newValue: {
            title: 'Cập nhật hồ sơ khách hàng',
            notes: `Cập nhật thông tin: ${Object.keys(updateData).join(', ')}`
          }
        }
      });
    } catch (_) {}

    return updated;
  }

  /**
   * Nhập khách hàng hàng loạt từ file Excel.
   * - Mã KH trống -> tự sinh theo định dạng KH00001, KH00002, ...
   * - Loại KH / Nguồn gốc chấp nhận mã (ENTERPRISE...) hoặc nhãn tiếng Việt (Doanh nghiệp...)
   * - Người phụ trách: so khớp theo Họ tên / Mã NV / Email; trống -> người đang nhập
   * - Lỗi được ghi nhận theo từng dòng, các dòng hợp lệ vẫn được lưu
   */
  async importCustomers(rows: ImportCustomerRow[], creatorId: string) {
    await ensureCustomerConstraintsRelaxed();

    const [existingCustomers, users] = await Promise.all([
      prisma.customer.findMany({ select: { code: true, phone: true, taxCode: true, name: true } }),
      prisma.user.findMany({ select: { id: true, fullName: true, code: true, email: true } })
    ]);

    const usedCodes = new Set(existingCustomers.map((c: any) => String(c.code).toUpperCase()));

    // Số thứ tự tự sinh nối tiếp mã KH lớn nhất đang có trong hệ thống
    let maxSeq = 0;
    usedCodes.forEach((code) => {
      const m = /^KH(\d+)$/.exec(code);
      if (m) maxSeq = Math.max(maxSeq, parseInt(m[1], 10));
    });

    // Mã do người dùng tự điền trong file cũng phải được giữ chỗ để mã tự sinh không bị trùng
    rows.forEach((r) => {
      const code = cleanText(r.code).toUpperCase();
      if (code) usedCodes.add(code);
    });
    const nextCode = () => {
      let code = '';
      do {
        maxSeq += 1;
        code = `KH${String(maxSeq).padStart(5, '0')}`;
      } while (usedCodes.has(code));
      usedCodes.add(code);
      return code;
    };

    const userLookup = new Map<string, string>();
    users.forEach((u: any) => {
      if (u.fullName) userLookup.set(normalizeKey(u.fullName), u.id);
      if (u.code) userLookup.set(normalizeKey(u.code), u.id);
      if (u.email) userLookup.set(normalizeKey(u.email), u.id);
    });

    const fileCodes = new Set<string>();
    const created: { rowNumber: number; code: string; name: string }[] = [];
    const failed: { rowNumber: number; name: string; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || {};
      const rowNumber = Number(r.rowNumber) || i + 2;
      const name = cleanText(r.name);
      try {
        if (!name) throw new Error('Thiếu Tên khách hàng');

        const contactPhone = normalizePhone(r.contactPhone);
        const phone = normalizePhone(r.phone) || contactPhone;
        const taxCode = normalizeTaxCode(r.taxCode);

        let customerType = 'ENTERPRISE';
        if (cleanText(r.customerType)) {
          const mapped = CUSTOMER_TYPE_ALIASES[normalizeKey(r.customerType)];
          if (mapped) {
            customerType = mapped;
          }
        }

        let source = 'SELF_FOUND';
        if (cleanText(r.source)) {
          const mapped = SOURCE_ALIASES[normalizeKey(r.source)];
          if (mapped) {
            source = mapped;
          }
        }

        let managerId = creatorId;
        if (cleanText(r.manager)) {
          const found = userLookup.get(normalizeKey(r.manager));
          if (found) managerId = found;
        }

        let code = cleanText(r.code).toUpperCase();
        if (code && !fileCodes.has(code) && !existingCustomers.some((c: any) => String(c.code).toUpperCase() === code)) {
          fileCodes.add(code);
        } else {
          code = nextCode();
        }

        const address = cleanText(r.address);
        const deliveryAddress = cleanText(r.deliveryAddress) || address;

        await prisma.customer.create({
          data: {
            code,
            name,
            phone: (phone || null) as any,
            taxCode: taxCode || null,
            address: address || null,
            deliveryAddress: deliveryAddress || null,
            customerType,
            source,
            contactPerson: cleanText(r.contactPerson) || null,
            contactPhone: contactPhone || null,
            managerId,
            status: 'ACTIVE'
          }
        });

        created.push({ rowNumber, code, name });
      } catch (err: any) {
        failed.push({ rowNumber, name, message: err?.message || 'Lỗi lưu khách hàng' });
      }
    }

    return {
      total: rows.length,
      successCount: created.length,
      failedCount: failed.length,
      created,
      failed
    };
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
      const updated = await prisma.customer.update({
        where: { id },
        data: { status: 'INACTIVE' }
      });
      return { ...updated, isSoftDeleted: true };
    }

    const deleted = await prisma.customer.delete({ where: { id } });
    return { ...deleted, isSoftDeleted: false };
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

  async addCustomerCareLog(customerId: string, data: { actionType?: string; title?: string; notes: string }, userId?: string) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new Error('Không tìm thấy khách hàng');

    const log = await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: 'CARE_LOG',
        entityType: 'Customer',
        entityId: customerId,
        newValue: {
          actionType: data.actionType || 'NOTE',
          title: data.title || 'Nhật ký chăm sóc',
          notes: data.notes
        }
      },
      include: {
        user: { select: { fullName: true } }
      }
    });

    return log;
  }

  async getCustomerTimeline(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { manager: { select: { fullName: true } } }
    });
    if (!customer) throw new Error('Không tìm thấy khách hàng');

    const [quotations, orders, handovers, receipts, auditLogs] = await Promise.all([
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
      }),
      prisma.auditLog.findMany({
        where: { entityType: 'Customer', entityId: id },
        include: { user: { select: { fullName: true } } },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Gom nhóm timeline theo thời gian: Hành động của người dùng trên web đối với khách hàng đó
    const timeline: any[] = [
      ...auditLogs.map((log: any) => {
        const val = (log.newValue && typeof log.newValue === 'object') ? log.newValue : {};
        return {
          id: log.id,
          type: log.action === 'CARE_LOG' ? 'CARE_LOG' : log.action === 'UPDATE' ? 'UPDATE' : 'ACTION',
          actionType: val.actionType || 'NOTE',
          title: val.title || (log.action === 'CARE_LOG' ? 'Nhật ký chăm sóc' : log.action === 'UPDATE' ? 'Cập nhật hồ sơ khách hàng' : 'Thao tác trên hệ thống'),
          notes: val.notes || '',
          actor: log.user?.fullName || 'Người dùng',
          date: log.createdAt
        };
      }),
      ...quotations.map((q: any) => ({
        id: q.id,
        type: 'QUOTATION',
        title: `Lập báo giá: ${q.code}`,
        status: q.status,
        amount: q.totalAmount,
        date: q.createdAt,
        notes: q.notes,
        actor: q.manager?.fullName || 'Nhân viên kinh doanh'
      })),
      ...orders.map((o: any) => ({
        id: o.id,
        type: 'ORDER',
        title: `Tạo đơn bán hàng: ${o.code}`,
        status: o.deliveryStatus,
        paymentStatus: o.paymentStatus,
        amount: o.totalAmount,
        paid: o.paidAmount,
        remaining: o.remainingAmount,
        date: o.createdAt,
        notes: o.notes,
        actor: o.manager?.fullName || 'Nhân viên kinh doanh'
      })),
      ...receipts.map((r: any) => ({
        id: r.id,
        type: 'RECEIPT',
        title: `Lập phiếu thu tiền: ${r.code}`,
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
        actor: h.fromUser?.fullName || h.toUser.fullName
      }))
    ];

    // Thêm mốc sự kiện Khởi tạo hồ sơ khách hàng (nếu chưa có trong audit log)
    const hasCreationLog = auditLogs.some((l: any) => l.action === 'CREATE');
    if (!hasCreationLog && customer.createdAt) {
      const typeLabels: Record<string, string> = {
        ENTERPRISE: 'Doanh nghiệp',
        SCHOOL: 'Trường học',
        ORGANIZATION: 'Cơ quan / Tổ chức',
        HOUSEHOLD: 'Đại lý / Cửa hàng',
        INDIVIDUAL: 'Cá nhân'
      };
      timeline.push({
        id: `created-${customer.id}`,
        type: 'CREATION',
        title: `Khởi tạo hồ sơ khách hàng: ${customer.name}`,
        date: customer.createdAt,
        actor: customer.manager?.fullName || 'Người dùng',
        notes: `Mã khách hàng: ${customer.code} • Loại: ${typeLabels[customer.customerType] || customer.customerType}`
      });
    }

    timeline.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return timeline;
  }
}

export const customersService = new CustomersService();
