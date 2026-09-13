import { prisma } from '../../config/db';

export class InventoryService {
  async getInventoryOverview() {
    const [products, categories, productTypes, warehouses] = await Promise.all([
      prisma.product.findMany({
        where: { status: 'ACTIVE' },
        include: {
          categoryRel: true,
          warehouse: true,
          productType: true
        }
      }),
      prisma.category.findMany(),
      prisma.productType.findMany(),
      prisma.warehouse.findMany()
    ]);

    const totalQuantity = products.reduce((sum, p) => sum + p.stockQuantity, 0);
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.stockQuantity * Number(p.costPrice),
      0
    );
    const totalCategories = categories.length;
    const totalProductTypes = productTypes.length;

    // Cơ cấu giá trị tồn kho theo danh mục
    const catMap: Record<string, { code: string; name: string; quantity: number; value: number }> = {};
    categories.forEach((cat) => {
      catMap[cat.name] = {
        code: cat.code,
        name: cat.name,
        quantity: 0,
        value: 0
      };
    });

    products.forEach((p) => {
      const catKey = p.categoryRel?.name || p.category || 'Khác';
      if (!catMap[catKey]) {
        catMap[catKey] = {
          code: p.categoryRel?.code || 'DM-OTHER',
          name: catKey,
          quantity: 0,
          value: 0
        };
      }
      catMap[catKey].quantity += p.stockQuantity;
      catMap[catKey].value += p.stockQuantity * Number(p.costPrice);
    });

    const categoryBreakdown = Object.values(catMap).map((cat) => ({
      ...cat,
      percentage: totalInventoryValue > 0 ? Math.round((cat.value / totalInventoryValue) * 100) : 0
    }));

    // Phân bổ theo Kho vật lý
    const whMap: Record<string, { id: string; code: string; name: string; skuCount: number; quantity: number; value: number }> = {};
    warehouses.forEach((wh) => {
      whMap[wh.id] = {
        id: wh.id,
        code: wh.code,
        name: wh.name,
        skuCount: 0,
        quantity: 0,
        value: 0
      };
    });

    products.forEach((p) => {
      if (p.warehouseId && whMap[p.warehouseId]) {
        whMap[p.warehouseId].skuCount += 1;
        whMap[p.warehouseId].quantity += p.stockQuantity;
        whMap[p.warehouseId].value += p.stockQuantity * Number(p.costPrice);
      }
    });

    const warehouseBreakdown = Object.values(whMap);

    // Cảnh báo sắp hết hàng (tồn <= minStockLevel)
    const lowStockProducts = products
      .filter((p) => p.stockQuantity <= p.minStockLevel)
      .map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        unit: p.unit,
        category: p.category,
        stockQuantity: p.stockQuantity,
        minStockLevel: p.minStockLevel,
        warehouseName: p.warehouse?.name || 'Tổng kho'
      }));

    // Top 5 sản phẩm tồn kho giá trị cao nhất
    const topValueProducts = products
      .map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        category: p.category,
        unit: p.unit,
        stockQuantity: p.stockQuantity,
        costPrice: Number(p.costPrice),
        inventoryValue: p.stockQuantity * Number(p.costPrice),
        warehouseName: p.warehouse?.name || 'Tổng kho'
      }))
      .sort((a, b) => b.inventoryValue - a.inventoryValue)
      .slice(0, 5);

    return {
      kpis: {
        totalQuantity,
        totalInventoryValue,
        totalCategories,
        totalProductTypes,
        totalWarehouses: warehouses.length,
        lowStockCount: lowStockProducts.length
      },
      categoryBreakdown,
      warehouseBreakdown,
      lowStockProducts,
      topValueProducts
    };
  }

  async getInventoryReport(view: 'category' | 'type' | 'product' = 'category') {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        warehouse: true,
        categoryRel: true,
        productType: true,
        supplier: true
      },
      orderBy: { code: 'asc' }
    });

    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.stockQuantity * Number(p.costPrice),
      0
    );

    if (view === 'category') {
      const catMap: Record<string, { code: string; name: string; quantity: number; value: number }> = {};
      products.forEach((p) => {
        const catKey = p.categoryRel?.name || p.category || 'Khác';
        if (!catMap[catKey]) {
          catMap[catKey] = {
            code: p.categoryRel?.code || 'DM-OTHER',
            name: catKey,
            quantity: 0,
            value: 0
          };
        }
        catMap[catKey].quantity += p.stockQuantity;
        catMap[catKey].value += p.stockQuantity * Number(p.costPrice);
      });

      const items = Object.values(catMap).map((c, idx) => ({
        stt: idx + 1,
        code: c.code,
        name: c.name,
        quantity: c.quantity,
        value: c.value,
        percentage: totalInventoryValue > 0 ? ((c.value / totalInventoryValue) * 100).toFixed(1) : '0'
      }));

      return { totalInventoryValue, items };
    }

    if (view === 'type') {
      const typeMap: Record<string, { code: string; name: string; categoryName: string; unit: string; quantity: number; value: number }> = {};
      products.forEach((p) => {
        const typeKey = p.productType?.name || 'Chưa phân loại';
        if (!typeMap[typeKey]) {
          typeMap[typeKey] = {
            code: p.productType?.code || 'LH-OTHER',
            name: typeKey,
            categoryName: p.categoryRel?.name || p.category || 'Chung',
            unit: p.productType?.unit || p.unit,
            quantity: 0,
            value: 0
          };
        }
        typeMap[typeKey].quantity += p.stockQuantity;
        typeMap[typeKey].value += p.stockQuantity * Number(p.costPrice);
      });

      const items = Object.values(typeMap).map((t, idx) => ({
        stt: idx + 1,
        code: t.code,
        name: t.name,
        categoryName: t.categoryName,
        unit: t.unit,
        quantity: t.quantity,
        value: t.value,
        percentage: totalInventoryValue > 0 ? ((t.value / totalInventoryValue) * 100).toFixed(1) : '0'
      }));

      return { totalInventoryValue, items };
    }

    // Theo chi tiết từng mặt hàng SKU
    const items = products.map((p, idx) => {
      const val = p.stockQuantity * Number(p.costPrice);
      return {
        stt: idx + 1,
        id: p.id,
        code: p.code,
        barcode: p.barcode || 'N/A',
        name: p.name,
        categoryName: p.categoryRel?.name || p.category,
        typeName: p.productType?.name || 'Tiêu chuẩn',
        warehouseName: p.warehouse?.name || 'Tổng kho',
        unit: p.unit,
        quantity: p.stockQuantity,
        minStockLevel: p.minStockLevel,
        costPrice: Number(p.costPrice),
        sellingPrice: Number(p.sellingPrice),
        value: val,
        percentage: totalInventoryValue > 0 ? ((val / totalInventoryValue) * 100).toFixed(1) : '0',
        status: p.stockQuantity <= p.minStockLevel ? 'LOW_STOCK' : 'NORMAL'
      };
    });

    return { totalInventoryValue, items };
  }
}

export const inventoryService = new InventoryService();
