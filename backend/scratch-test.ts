/// <reference types="node" />
import process from 'node:process';
import { productsService } from './src/modules/products/products.service';
import { prisma } from './src/config/db';

async function test() {
  const testCode = `TEST-${Date.now()}`;
  console.log('Testing createProduct with code:', testCode);

  // 1. Test creation without category string (only categoryId or default)
  const product = await productsService.createProduct({
    code: testCode,
    name: 'Bút bi Thiên Long Test SKU',
    unit: 'Cây',
    costPrice: 4000,
    sellingPrice: 6000,
    vatRate: 8,
    stockQuantity: 50,
    minStockLevel: 10,
    description: 'Test SKU product saving'
  });

  console.log('Created product successfully:', {
    id: product.id,
    code: product.code,
    name: product.name,
    category: product.category,
    unit: product.unit,
    costPrice: product.costPrice,
    sellingPrice: product.sellingPrice
  });

  // 2. Test updateProduct with empty strings (the common issue from form inputs)
  const updated = await productsService.updateProduct(product.id, {
    warehouseId: '',
    categoryId: '',
    productTypeId: '',
    supplierId: '',
    barcode: '',
    sellingPrice: 7000
  });

  console.log('Updated product successfully:', {
    id: updated.id,
    sellingPrice: updated.sellingPrice,
    warehouseId: updated.warehouseId,
    categoryId: updated.categoryId
  });

  // Clean up test product
  await prisma.product.delete({ where: { id: product.id } });
  console.log('Cleaned up test product.');
}

test()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  });
