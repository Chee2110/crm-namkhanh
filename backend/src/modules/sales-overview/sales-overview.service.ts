import { prisma } from '../../config/db';

export class SalesOverviewService {
  async getSalesOverview(period: 'year' | 'quarter' | 'month' = 'year') {
    const now = new Date();
    let startDate = new Date(now.getFullYear(), 0, 1);

    if (period === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // 1. Lấy tất cả đơn hàng từ ngày bắt đầu
    const orders = await prisma.order.findMany({
      where: {
        orderDate: { gte: startDate }
      },
      include: {
        customer: { select: { id: true, name: true, code: true, phone: true } },
        manager: { select: { id: true, fullName: true } },
        items: {
          include: { product: true }
        }
      },
      orderBy: { orderDate: 'desc' }
    });

    // 2. Thống kê KPI
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
    const totalOrders = orders.length;
    const totalPaid = orders.reduce((sum: number, o: any) => sum + Number(o.paidAmount), 0);
    const totalDebt = orders.reduce((sum: number, o: any) => sum + Number(o.remainingAmount), 0);

    const customerIds = new Set(orders.map((o: any) => o.customerId));
    const activeCustomersCount = customerIds.size;

    let totalVolume = 0;
    const categoryStats: Record<string, { quantity: number; revenue: number }> = {
      'Giấy in văn phòng': { quantity: 0, revenue: 0 },
      'Bút viết & Mực': { quantity: 0, revenue: 0 },
      'File bìa còng & Lưu trữ': { quantity: 0, revenue: 0 },
      'Dụng cụ văn phòng': { quantity: 0, revenue: 0 },
      'Thiết bị & Máy văn phòng': { quantity: 0, revenue: 0 }
    };

    orders.forEach((o: any) => {
      o.items.forEach((item: any) => {
        totalVolume += item.quantity;
        const cat = item.product?.category || 'Giấy in văn phòng';
        if (!categoryStats[cat]) {
          categoryStats[cat] = { quantity: 0, revenue: 0 };
        }
        categoryStats[cat].quantity += item.quantity;
        categoryStats[cat].revenue += Number(item.total);
      });
    });

    const categoryBreakdown = Object.entries(categoryStats).map(([name, stat]) => ({
      name,
      quantity: stat.quantity,
      revenue: stat.revenue,
      percentage: totalRevenue > 0 ? Math.round((stat.revenue / totalRevenue) * 100) : 0
    }));

    // 3. Doanh thu 12 tháng trong năm hiện tại
    const currentYearOrders = await prisma.order.findMany({
      where: {
        orderDate: { gte: new Date(now.getFullYear(), 0, 1) }
      },
      select: { orderDate: true, totalAmount: true }
    });

    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => ({
      month: `Thg ${i + 1}`,
      revenue: 0
    }));

    currentYearOrders.forEach((o: any) => {
      const monthIdx = new Date(o.orderDate).getMonth();
      if (monthIdx >= 0 && monthIdx < 12) {
        monthlyRevenue[monthIdx].revenue += Number(o.totalAmount);
      }
    });

    // 4. Top 5 khách hàng lớn nhất
    const customerMap: Record<string, { name: string; code: string; phone: string; totalRevenue: number; orderCount: number }> = {};
    orders.forEach((o: any) => {
      if (!customerMap[o.customerId]) {
        customerMap[o.customerId] = {
          name: o.customer.name,
          code: o.customer.code,
          phone: o.customer.phone,
          totalRevenue: 0,
          orderCount: 0
        };
      }
      customerMap[o.customerId].totalRevenue += Number(o.totalAmount);
      customerMap[o.customerId].orderCount += 1;
    });

    const topCustomers = Object.values(customerMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    // 5. Đơn hàng gần nhất
    const recentOrders = orders.slice(0, 5).map((o: any) => ({
      id: o.id,
      code: o.code,
      customerName: o.customer.name,
      managerName: o.manager?.fullName,
      totalAmount: o.totalAmount,
      deliveryStatus: o.deliveryStatus,
      paymentStatus: o.paymentStatus,
      orderDate: o.orderDate
    }));

    return {
      period,
      kpis: {
        totalRevenue,
        totalOrders,
        totalPaid,
        totalDebt,
        activeCustomersCount,
        totalVolume
      },
      categoryBreakdown,
      monthlyRevenue,
      topCustomers,
      recentOrders
    };
  }
}

export const salesOverviewService = new SalesOverviewService();
