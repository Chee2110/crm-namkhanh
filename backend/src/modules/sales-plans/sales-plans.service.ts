import { prisma } from '../../config/db';

export class SalesPlansService {
  async getSalesPlans(params?: { year?: number; periodType?: string }) {
    const where: any = {};
    if (params?.year) where.year = Number(params.year);
    if (params?.periodType) where.periodType = params.periodType;

    return prisma.salesPlan.findMany({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true, code: true } },
        department: { select: { id: true, name: true } },
        items: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getSalesPlanById(id: string) {
    const plan = await prisma.salesPlan.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true, code: true, email: true } },
        department: true,
        items: true
      }
    });
    if (!plan) throw new Error('Không tìm thấy kế hoạch kinh doanh');
    return plan;
  }

  async createSalesPlan(
    data: {
      title: string;
      periodType?: string;
      periodValue: string;
      year?: number;
      departmentId?: string;
      notes?: string;
      items: Array<{
        category: string;
        unit: string;
        targetQuantity: number;
        targetRevenue: number;
        actualQuantity?: number;
        actualRevenue?: number;
      }>;
    },
    creatorId: string
  ) {
    return prisma.salesPlan.create({
      data: {
        title: data.title,
        periodType: data.periodType || 'MONTH',
        periodValue: data.periodValue,
        year: data.year || new Date().getFullYear(),
        departmentId: data.departmentId || null,
        createdById: creatorId,
        notes: data.notes,
        status: 'ACTIVE',
        items: {
          create: data.items.map((it) => ({
            category: it.category,
            unit: it.unit,
            targetQuantity: Number(it.targetQuantity) || 0,
            targetRevenue: Number(it.targetRevenue) || 0,
            actualQuantity: Number(it.actualQuantity) || 0,
            actualRevenue: Number(it.actualRevenue) || 0
          }))
        }
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        items: true
      }
    });
  }

  async updateSalesPlan(id: string, data: any) {
    const plan = await prisma.salesPlan.findUnique({ where: { id } });
    if (!plan) throw new Error('Không tìm thấy kế hoạch kinh doanh');

    if (data.items && Array.isArray(data.items)) {
      return prisma.$transaction(async (tx: any) => {
        await tx.salesPlanItem.deleteMany({ where: { salesPlanId: id } });

        return tx.salesPlan.update({
          where: { id },
          data: {
            title: data.title || plan.title,
            periodType: data.periodType || plan.periodType,
            periodValue: data.periodValue || plan.periodValue,
            year: data.year || plan.year,
            notes: data.notes !== undefined ? data.notes : plan.notes,
            status: data.status || plan.status,
            items: {
              create: data.items.map((it: any) => ({
                category: it.category,
                unit: it.unit,
                targetQuantity: Number(it.targetQuantity) || 0,
                targetRevenue: Number(it.targetRevenue) || 0,
                actualQuantity: Number(it.actualQuantity) || 0,
                actualRevenue: Number(it.actualRevenue) || 0
              }))
            }
          },
          include: { createdBy: true, items: true }
        });
      });
    }

    return prisma.salesPlan.update({
      where: { id },
      data: {
        title: data.title,
        notes: data.notes,
        status: data.status
      },
      include: { createdBy: true, items: true }
    });
  }

  async comparePlan(id: string) {
    const plan = await this.getSalesPlanById(id);

    const comparedItems = plan.items.map((it: any) => {
      const targetRev = Number(it.targetRevenue);
      const actualRev = Number(it.actualRevenue);
      const targetQty = it.targetQuantity;
      const actualQty = it.actualQuantity;

      const revenuePercent = targetRev > 0 ? ((actualRev / targetRev) * 100).toFixed(1) : '0';
      const quantityPercent = targetQty > 0 ? ((actualQty / targetQty) * 100).toFixed(1) : '0';

      return {
        ...it,
        targetRevenue: targetRev,
        actualRevenue: actualRev,
        revenuePercent: Number(revenuePercent),
        quantityPercent: Number(quantityPercent),
        isCompleted: actualRev >= targetRev
      };
    });

    const totalTargetRev = comparedItems.reduce((sum: number, it: any) => sum + it.targetRevenue, 0);
    const totalActualRev = comparedItems.reduce((sum: number, it: any) => sum + it.actualRevenue, 0);
    const overallPercent = totalTargetRev > 0 ? ((totalActualRev / totalTargetRev) * 100).toFixed(1) : '0';

    return {
      plan,
      summary: {
        totalTargetRevenue: totalTargetRev,
        totalActualRevenue: totalActualRev,
        overallPercent: Number(overallPercent)
      },
      items: comparedItems
    };
  }

  async deleteSalesPlan(id: string) {
    const plan = await prisma.salesPlan.findUnique({ where: { id } });
    if (!plan) throw new Error('Không tìm thấy kế hoạch kinh doanh');
    return prisma.salesPlan.delete({ where: { id } });
  }
}

export const salesPlansService = new SalesPlansService();
