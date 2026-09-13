import { prisma } from '../../config/db';

export class SalesReportsService {
  async getRevenueReport(view: 'category' | 'product' | 'manager' = 'category') {
    if (view === 'category') {
      const items = await prisma.orderItem.findMany({
        include: { product: true }
      });

      const totalRevenue = items.reduce((sum: number, it: any) => sum + Number(it.total), 0);
      const catMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

      items.forEach((it: any) => {
        const cat = it.product?.category || 'Giấy in văn phòng';
        if (!catMap[cat]) {
          catMap[cat] = { name: cat, quantity: 0, revenue: 0 };
        }
        catMap[cat].quantity += it.quantity;
        catMap[cat].revenue += Number(it.total);
      });

      const data = Object.values(catMap).map((c, idx) => ({
        stt: idx + 1,
        code: `DM-${String(idx + 1).padStart(2, '0')}`,
        name: c.name,
        quantity: c.quantity,
        revenue: c.revenue,
        percentage: totalRevenue > 0 ? ((c.revenue / totalRevenue) * 100).toFixed(1) : '0'
      }));

      return { totalRevenue, items: data };
    }

    if (view === 'product') {
      const items = await prisma.orderItem.findMany();
      const totalRevenue = items.reduce((sum: number, it: any) => sum + Number(it.total), 0);
      const prodMap: Record<string, { code: string; name: string; unit: string; quantity: number; revenue: number }> = {};

      items.forEach((it: any) => {
        if (!prodMap[it.productCode]) {
          prodMap[it.productCode] = {
            code: it.productCode,
            name: it.productName,
            unit: it.unit,
            quantity: 0,
            revenue: 0
          };
        }
        prodMap[it.productCode].quantity += it.quantity;
        prodMap[it.productCode].revenue += Number(it.total);
      });

      const data = Object.values(prodMap).map((p, idx) => ({
        stt: idx + 1,
        code: p.code,
        name: p.name,
        unit: p.unit,
        quantity: p.quantity,
        revenue: p.revenue,
        percentage: totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : '0'
      }));

      return { totalRevenue, items: data };
    }

    // Theo nhân viên kinh doanh
    const orders = await prisma.order.findMany({
      include: {
        manager: { select: { id: true, fullName: true, code: true } }
      }
    });

    const totalRevenue = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
    const repMap: Record<string, { code: string; name: string; orderCount: number; revenue: number }> = {};

    orders.forEach((o: any) => {
      const repKey = o.managerId || 'UNASSIGNED';
      if (!repMap[repKey]) {
        repMap[repKey] = {
          code: o.manager?.code || 'NV000',
          name: o.manager?.fullName || 'Chưa phân công',
          orderCount: 0,
          revenue: 0
        };
      }
      repMap[repKey].orderCount += 1;
      repMap[repKey].revenue += Number(o.totalAmount);
    });

    const data = Object.values(repMap).map((r, idx) => ({
      stt: idx + 1,
      code: r.code,
      name: r.name,
      orderCount: r.orderCount,
      revenue: r.revenue,
      percentage: totalRevenue > 0 ? ((r.revenue / totalRevenue) * 100).toFixed(1) : '0'
    }));

    return { totalRevenue, items: data };
  }

  async getDebtsReport(search?: string) {
    const customers = await prisma.customer.findMany({
      include: {
        manager: { select: { fullName: true, code: true } },
        orders: {
          select: { totalAmount: true, paidAmount: true, remainingAmount: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalDebtAll = 0;
    let totalPurchasedAll = 0;
    let totalPaidAll = 0;

    const data = customers
      .map((c: any, idx: number) => {
        const totalPurchased = c.orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
        const totalPaid = c.orders.reduce((sum: number, o: any) => sum + Number(o.paidAmount), 0);
        const totalDebt = c.orders.reduce((sum: number, o: any) => sum + Number(o.remainingAmount), 0);

        totalPurchasedAll += totalPurchased;
        totalPaidAll += totalPaid;
        totalDebtAll += totalDebt;

        return {
          stt: idx + 1,
          id: c.id,
          code: c.code,
          name: c.name,
          phone: c.phone,
          taxCode: c.taxCode,
          managerName: c.manager?.fullName || 'Chưa phân công',
          orderCount: c.orders.length,
          totalPurchased,
          totalPaid,
          totalDebt,
          status: totalDebt > 0 ? 'CON_NO' : 'HET_NO'
        };
      })
      .filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return c.name.toLowerCase().includes(s) || c.code.toLowerCase().includes(s) || c.phone.includes(s);
      });

    return {
      summary: {
        totalPurchased: totalPurchasedAll,
        totalPaid: totalPaidAll,
        totalDebt: totalDebtAll,
        customerWithDebtCount: data.filter((c: any) => c.totalDebt > 0).length
      },
      customers: data
    };
  }
}

export const salesReportsService = new SalesReportsService();
