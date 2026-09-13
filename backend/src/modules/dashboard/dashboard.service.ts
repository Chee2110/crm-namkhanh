import { prisma } from '../../config/db';
import { cacheService } from '../../config/redis';

export class DashboardService {
  private async getCache(key: string): Promise<any | null> {
    return cacheService.get(key);
  }

  private async setCache(key: string, data: any): Promise<void> {
    await cacheService.set(key, data, 300);
  }

  public async clearCache(key?: string): Promise<void> {
    if (key) await cacheService.del(key);
  }

  private getDateRange(period: 'all' | 'year' | 'month') {
    const now = new Date();
    if (period === 'month') {
      const gte = new Date(now.getFullYear(), now.getMonth(), 1);
      const lte = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      return { gte, lte };
    }
    if (period === 'year') {
      const gte = new Date(now.getFullYear(), 0, 1);
      const lte = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      return { gte, lte };
    }
    return undefined; // 'all'
  }

  // ==============================================================
  // 1. TỔNG QUAN ĐIỀU HÀNH EXECUTIVE OVERVIEW (6 THẺ KPI)
  // ==============================================================
  async getExecutiveOverview(period: 'all' | 'year' | 'month' = 'year', refresh = false) {
    const cacheKey = `dashboard:overview:${period}`;
    if (!refresh) {
      const cached = await this.getCache(cacheKey);
      if (cached) return cached;
    }

    const dateRange = this.getDateRange(period);
    const orderWhere: any = { deliveryStatus: { not: 'CANCELLED' } };
    if (dateRange) {
      orderWhere.orderDate = dateRange;
    }

    const voucherWhere: any = { status: 'PAID' };
    if (dateRange) {
      voucherWhere.voucherDate = dateRange;
    }

    const [orders, orderItems, products, receiptVouchers, paymentVouchers] = await Promise.all([
      // Lấy danh sách đơn hàng
      prisma.order.findMany({
        where: orderWhere,
        select: {
          id: true,
          totalAmount: true,
          paidAmount: true,
          remainingAmount: true,
          paymentStatus: true
        }
      }),
      // Lấy chi tiết mặt hàng đơn hàng để tính giá vốn & sản lượng
      prisma.orderItem.findMany({
        where: {
          order: orderWhere
        },
        include: {
          product: {
            select: {
              costPrice: true,
              sellingPrice: true,
              categoryId: true
            }
          }
        }
      }),
      // Lấy tồn kho sản phẩm
      prisma.product.findMany({
        select: {
          id: true,
          stockQuantity: true,
          minStockLevel: true,
          costPrice: true
        }
      }),
      // Phiếu thu đã thu
      prisma.receiptVoucher.findMany({
        where: voucherWhere,
        select: { amount: true }
      }),
      // Phiếu chi đã chi
      prisma.paymentVoucher.findMany({
        where: voucherWhere,
        select: { amount: true }
      })
    ]);

    // 1. Doanh thu thuần
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const orderCount = orders.length;

    // 2. Sản lượng bán (Tổng số lượng sản phẩm bán ra)
    const totalVolume = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    // 3. Giá vốn hàng bán (COGS)
    const totalCogs = orderItems.reduce((sum, item) => {
      const cost = Number(item.product?.costPrice || 0);
      return sum + item.quantity * cost;
    }, 0);

    // 4. Lợi nhuận gộp & Biên lợi nhuận
    const grossProfit = totalRevenue - totalCogs;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // 5. Tổng công nợ phải thu của khách
    const totalDebt = orders.reduce((sum, o) => sum + Number(o.remainingAmount), 0);

    // 6. Dòng tiền ròng thực tế (Net Cashflow)
    const totalReceipts = receiptVouchers.reduce((sum, r) => sum + Number(r.amount), 0);
    const totalPayments = paymentVouchers.reduce((sum, p) => sum + Number(p.amount), 0);
    const netCashflow = totalReceipts - totalPayments;

    // 7. Giá trị tồn kho
    const totalStockQuantity = products.reduce((sum, p) => sum + p.stockQuantity, 0);
    const totalInventoryValue = products.reduce((sum, p) => sum + p.stockQuantity * Number(p.costPrice), 0);
    const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockLevel).length;

    const result = {
      period,
      kpis: {
        totalRevenue,
        orderCount,
        totalVolume,
        totalCogs,
        grossProfit,
        grossMargin: Number(grossMargin.toFixed(2)),
        totalDebt,
        netCashflow,
        totalReceipts,
        totalPayments,
        totalStockQuantity,
        totalInventoryValue,
        lowStockCount
      },
      updatedAt: new Date().toISOString()
    };

    await this.setCache(cacheKey, result);
    return result;
  }

  // ==============================================================
  // 2. [F-D1] DASHBOARD DOANH THU & SẢN LƯỢNG
  // ==============================================================
  async getRevenueAndVolume(period: 'all' | 'year' | 'month' = 'year', refresh = false) {
    const cacheKey = `dashboard:revenue_volume:${period}`;
    if (!refresh) {
      const cached = await this.getCache(cacheKey);
      if (cached) return cached;
    }

    const dateRange = this.getDateRange(period);
    const orderWhere: any = { deliveryStatus: { not: 'CANCELLED' } };
    if (dateRange) {
      orderWhere.orderDate = dateRange;
    }

    const [categories, orderItems, allOrdersInYear, customers] = await Promise.all([
      // Danh mục sản phẩm cấp 1
      prisma.category.findMany({
        orderBy: { code: 'asc' }
      }),
      // Chi tiết mặt hàng đơn hàng kèm danh mục
      prisma.orderItem.findMany({
        where: { order: orderWhere },
        include: {
          product: {
            include: { categoryRel: true }
          }
        }
      }),
      // Tất cả đơn hàng trong năm để vẽ biểu đồ 12 tháng
      prisma.order.findMany({
        where: {
          deliveryStatus: { not: 'CANCELLED' },
          orderDate: {
            gte: new Date(new Date().getFullYear(), 0, 1),
            lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59)
          }
        },
        select: {
          id: true,
          orderDate: true,
          totalAmount: true
        }
      }),
      // Khách hàng
      prisma.customer.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          phone: true,
          orders: {
            where: orderWhere,
            select: { totalAmount: true, remainingAmount: true }
          }
        }
      })
    ]);

    // Tính tổng toàn bộ
    const grandRevenue = orderItems.reduce((sum, item) => sum + Number(item.total), 0);
    const grandVolume = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    // Cơ cấu theo Danh mục hàng hóa (F-D1 DataGrid)
    const categoryMap: Record<
      string,
      { id: string; code: string; name: string; volume: number; revenue: number }
    > = {};

    categories.forEach((cat) => {
      categoryMap[cat.id] = {
        id: cat.id,
        code: cat.code,
        name: cat.name,
        volume: 0,
        revenue: 0
      };
    });

    // Gom dữ liệu bán hàng vào danh mục
    let otherRevenue = 0;
    let otherVolume = 0;

    orderItems.forEach((item) => {
      const catId = item.product?.categoryId;
      if (catId && categoryMap[catId]) {
        categoryMap[catId].volume += item.quantity;
        categoryMap[catId].revenue += Number(item.total);
      } else {
        otherRevenue += Number(item.total);
        otherVolume += item.quantity;
      }
    });

    const categoryBreakdown = Object.values(categoryMap).map((cat) => ({
      ...cat,
      percentage: grandRevenue > 0 ? Number(((cat.revenue / grandRevenue) * 100).toFixed(2)) : 0
    }));

    if (otherRevenue > 0) {
      categoryBreakdown.push({
        id: 'OTHER',
        code: 'KHAC',
        name: 'Sản phẩm khác',
        volume: otherVolume,
        revenue: otherRevenue,
        percentage: grandRevenue > 0 ? Number(((otherRevenue / grandRevenue) * 100).toFixed(2)) : 0
      });
    }

    // Biểu đồ biến động Doanh thu theo 12 Tháng
    const monthlyData: { month: string; monthNumber: number; revenue: number; orderCount: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const monthOrders = allOrdersInYear.filter((o) => new Date(o.orderDate).getMonth() === m);
      const rev = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
      monthlyData.push({
        month: `T${m + 1}`,
        monthNumber: m + 1,
        revenue: rev,
        orderCount: monthOrders.length
      });
    }

    // Top 5 sản phẩm bán chạy nhất
    const productStatsMap: Record<
      string,
      { id: string; code: string; name: string; unit: string; categoryName: string; quantity: number; revenue: number }
    > = {};

    orderItems.forEach((item) => {
      const pId = item.productId || item.productCode;
      if (!productStatsMap[pId]) {
        productStatsMap[pId] = {
          id: pId,
          code: item.productCode,
          name: item.productName,
          unit: item.unit,
          categoryName: item.product?.categoryRel?.name || 'VPP Khác',
          quantity: 0,
          revenue: 0
        };
      }
      productStatsMap[pId].quantity += item.quantity;
      productStatsMap[pId].revenue += Number(item.total);
    });

    const topProducts = Object.values(productStatsMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top 5 khách hàng VIP
    const topCustomers = customers
      .map((c) => {
        const totalSpent = c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        const remainingDebt = c.orders.reduce((sum, o) => sum + Number(o.remainingAmount), 0);
        return {
          id: c.id,
          code: c.code,
          name: c.name,
          phone: c.phone,
          orderCount: c.orders.length,
          totalSpent,
          remainingDebt
        };
      })
      .filter((c) => c.orderCount > 0)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    const result = {
      period,
      totals: {
        revenue: grandRevenue,
        volume: grandVolume
      },
      categoryBreakdown,
      monthlyData,
      topProducts,
      topCustomers,
      updatedAt: new Date().toISOString()
    };

    await this.setCache(cacheKey, result);
    return result;
  }

  // ==============================================================
  // 3. [F-D2] DASHBOARD LỢI NHUẬN GỘP (PROFIT DASHBOARD)
  // ==============================================================
  async getProfitDashboard(period: 'all' | 'year' | 'month' = 'year', refresh = false) {
    const cacheKey = `dashboard:profit:${period}`;
    if (!refresh) {
      const cached = await this.getCache(cacheKey);
      if (cached) return cached;
    }

    const dateRange = this.getDateRange(period);
    const orderWhere: any = { deliveryStatus: { not: 'CANCELLED' } };
    if (dateRange) {
      orderWhere.orderDate = dateRange;
    }

    const [categories, orderItems] = await Promise.all([
      prisma.category.findMany({ orderBy: { code: 'asc' } }),
      prisma.orderItem.findMany({
        where: { order: orderWhere },
        include: {
          product: {
            include: { categoryRel: true }
          }
        }
      })
    ]);

    // Khởi tạo map lợi nhuận theo danh mục
    const categoryProfitMap: Record<
      string,
      {
        id: string;
        code: string;
        name: string;
        revenue: number;
        cogs: number;
        profit: number;
        margin: number;
        contribution: number;
        isLoss: boolean;
      }
    > = {};

    categories.forEach((cat) => {
      categoryProfitMap[cat.id] = {
        id: cat.id,
        code: cat.code,
        name: cat.name,
        revenue: 0,
        cogs: 0,
        profit: 0,
        margin: 0,
        contribution: 0,
        isLoss: false
      };
    });

    let otherRevenue = 0;
    let otherCogs = 0;

    orderItems.forEach((item) => {
      const catId = item.product?.categoryId;
      const rev = Number(item.total);
      const cogs = item.quantity * Number(item.product?.costPrice || 0);

      if (catId && categoryProfitMap[catId]) {
        categoryProfitMap[catId].revenue += rev;
        categoryProfitMap[catId].cogs += cogs;
      } else {
        otherRevenue += rev;
        otherCogs += cogs;
      }
    });

    // Tính tổng Doanh thu, Tổng COGS, Tổng Lợi nhuận
    let totalRevenue = 0;
    let totalCogs = 0;

    Object.values(categoryProfitMap).forEach((c) => {
      totalRevenue += c.revenue;
      totalCogs += c.cogs;
    });
    totalRevenue += otherRevenue;
    totalCogs += otherCogs;

    const totalProfit = totalRevenue - totalCogs;
    const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Tính chi tiết margin & contribution cho từng danh mục
    const categoryProfits = Object.values(categoryProfitMap).map((cat) => {
      const profit = cat.revenue - cat.cogs;
      const margin = cat.revenue > 0 ? (profit / cat.revenue) * 100 : 0;
      const contribution = totalProfit > 0 ? (profit / totalProfit) * 100 : 0;
      return {
        ...cat,
        profit,
        margin: Number(margin.toFixed(2)),
        contribution: Number(contribution.toFixed(2)),
        isLoss: profit < 0 // Cảnh báo đỏ nếu bị âm lợi nhuận
      };
    });

    if (otherRevenue > 0) {
      const otherProfit = otherRevenue - otherCogs;
      const otherMargin = (otherProfit / otherRevenue) * 100;
      const otherContribution = totalProfit > 0 ? (otherProfit / totalProfit) * 100 : 0;
      categoryProfits.push({
        id: 'OTHER',
        code: 'KHAC',
        name: 'Sản phẩm khác',
        revenue: otherRevenue,
        cogs: otherCogs,
        profit: otherProfit,
        margin: Number(otherMargin.toFixed(2)),
        contribution: Number(otherContribution.toFixed(2)),
        isLoss: otherProfit < 0
      });
    }

    const result = {
      period,
      summary: {
        totalRevenue,
        totalCogs,
        totalProfit,
        overallMargin: Number(overallMargin.toFixed(2))
      },
      categoryProfits,
      updatedAt: new Date().toISOString()
    };

    await this.setCache(cacheKey, result);
    return result;
  }
}

export const dashboardService = new DashboardService();
