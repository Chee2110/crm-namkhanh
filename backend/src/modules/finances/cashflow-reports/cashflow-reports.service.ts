import { prisma } from '../../../config/db';

export class CashflowReportsService {
  async getCashflowSummary(period: 'month' | 'quarter' | 'year' | 'all' = 'month') {
    const now = new Date();
    const whereDate: any = {};

    if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      whereDate.gte = startOfMonth;
      whereDate.lte = endOfMonth;
    } else if (period === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const endOfQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
      whereDate.gte = startOfQuarter;
      whereDate.lte = endOfQuarter;
    } else if (period === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      whereDate.gte = startOfYear;
      whereDate.lte = endOfYear;
    }

    const receiptWhere: any = period !== 'all' ? { voucherDate: whereDate } : {};
    const paymentWhere: any = period !== 'all' ? { voucherDate: whereDate } : {};

    const [receipts, payments, revenueTypes, expenseCategories] = await Promise.all([
      prisma.receiptVoucher.findMany({
        where: receiptWhere,
        include: { type: true }
      }),
      prisma.paymentVoucher.findMany({
        where: paymentWhere,
        include: { category: true, type: true }
      }),
      prisma.revenueType.findMany(),
      prisma.expenseCategory.findMany()
    ]);

    // Tính toán số liệu Thu
    const totalReceipts = receipts.reduce((sum, r) => sum + Number(r.amount), 0);
    const paidReceipts = receipts
      .filter((r) => r.status === 'PAID')
      .reduce((sum, r) => sum + Number(r.amount), 0);
    const pendingReceipts = receipts
      .filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => sum + Number(r.amount), 0);

    // Tính toán số liệu Chi
    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const paidPayments = payments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingPayments = payments
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    // Dòng tiền ròng thực tế (Net Cashflow) = Thực thu - Thực chi
    const netCashflow = paidReceipts - paidPayments;

    // Cơ cấu thu theo Nhóm khoản thu
    const revMap: Record<string, { id: string; code: string; name: string; amount: number }> = {};
    revenueTypes.forEach((rt) => {
      revMap[rt.id] = { id: rt.id, code: rt.code, name: rt.name, amount: 0 };
    });

    receipts.forEach((r) => {
      const typeId = r.typeId || 'OTHER';
      if (!revMap[typeId]) {
        revMap[typeId] = {
          id: typeId,
          code: r.type?.code || 'KT-KHAC',
          name: r.type?.name || 'Khoản thu khác',
          amount: 0
        };
      }
      if (r.status === 'PAID') {
        revMap[typeId].amount += Number(r.amount);
      }
    });

    const revenueBreakdown = Object.values(revMap).map((item) => ({
      ...item,
      percentage: paidReceipts > 0 ? Math.round((item.amount / paidReceipts) * 100) : 0
    }));

    // Cơ cấu chi theo Danh mục chi phí
    const expMap: Record<string, { id: string; code: string; name: string; amount: number }> = {};
    expenseCategories.forEach((cat) => {
      expMap[cat.id] = { id: cat.id, code: cat.code, name: cat.name, amount: 0 };
    });

    payments.forEach((p) => {
      const catId = p.categoryId || 'OTHER';
      if (!expMap[catId]) {
        expMap[catId] = {
          id: catId,
          code: p.category?.code || 'CP-KHAC',
          name: p.category?.name || 'Chi phí khác',
          amount: 0
        };
      }
      if (p.status === 'PAID') {
        expMap[catId].amount += Number(p.amount);
      }
    });

    const expenseBreakdown = Object.values(expMap).map((item) => ({
      ...item,
      percentage: paidPayments > 0 ? Math.round((item.amount / paidPayments) * 100) : 0
    }));

    return {
      kpis: {
        totalReceipts,
        paidReceipts,
        pendingReceipts,
        totalPayments,
        paidPayments,
        pendingPayments,
        netCashflow,
        receiptCount: receipts.length,
        paymentCount: payments.length
      },
      revenueBreakdown,
      expenseBreakdown
    };
  }
}

export const cashflowReportsService = new CashflowReportsService();
