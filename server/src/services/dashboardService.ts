import { Product } from '../models/Product';
import { Sale } from '../models/Sale';
import { Purchase } from '../models/Purchase';
import { SaleReturn } from '../models/SaleReturn';
import { roundMoney } from '../utils/money';

export async function getDashboardSummary(storeId: string) {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  // 1. Products & Inventory Valuation
  const products = await Product.find({ storeId, active: true });
  const totalActiveProducts = products.length;

  let totalInventoryQuantity = 0;
  let inventoryValuationAtCost = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach((p) => {
    totalInventoryQuantity += p.availableQuantity;
    inventoryValuationAtCost += roundMoney(p.availableQuantity * p.currentCostBasis);

    if (p.availableQuantity <= 0) {
      outOfStockCount++;
    } else if (p.availableQuantity <= p.lowStockThreshold) {
      lowStockCount++;
    }
  });

  // 2. Today's Sales
  const todaySales = await Sale.find({
    storeId,
    createdAt: { $gte: startOfToday },
    status: { $ne: 'CANCELLED' },
  });

  let todayGrossSales = 0;
  let todayEstimatedGrossProfit = 0;
  let todayResellerSales = 0;
  let todayRetailSales = 0;

  todaySales.forEach((s) => {
    todayGrossSales += s.total;
    todayEstimatedGrossProfit += s.estimatedGrossProfit;
    if (s.customerType === 'RESELLER') {
      todayResellerSales += s.total;
    } else {
      todayRetailSales += s.total;
    }
  });

  // Today's returns
  const todayReturns = await SaleReturn.find({
    storeId,
    createdAt: { $gte: startOfToday },
  });
  const todayRefundTotal = todayReturns.reduce((sum, r) => sum + r.refundTotal, 0);

  // 3. Recent Sales & Purchases
  const recentSales = await Sale.find({ storeId })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('saleNumber customerType total estimatedGrossProfit paymentDetails createdAt status');

  const recentPurchases = await Purchase.find({ storeId })
    .sort({ purchasedAt: -1 })
    .limit(5)
    .select('invoiceNumber supplierNameSnapshot grandTotal paymentStatus purchasedAt lineItems');

  // 4. Low stock products list preview
  const lowStockProducts = await Product.find({
    storeId,
    active: true,
    $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] },
  })
    .sort({ availableQuantity: 1 })
    .limit(8)
    .select('name sku baseUnit availableQuantity lowStockThreshold resellerPrice retailPrice');

  return {
    overview: {
      totalActiveProducts,
      totalInventoryQuantity: roundMoney(totalInventoryQuantity, 2),
      inventoryValuationAtCost: roundMoney(inventoryValuationAtCost, 2),
      todayGrossSales: roundMoney(todayGrossSales, 2),
      todayEstimatedGrossProfit: roundMoney(todayEstimatedGrossProfit - todayRefundTotal, 2),
      todayNetSales: roundMoney(todayGrossSales - todayRefundTotal, 2),
      todayResellerSales: roundMoney(todayResellerSales, 2),
      todayRetailSales: roundMoney(todayRetailSales, 2),
      lowStockCount,
      outOfStockCount,
    },
    recentSales,
    recentPurchases,
    lowStockProducts,
    disclaimer:
      'Estimated gross profit is calculated as revenue minus cost of goods sold from recorded batches. Operating expenses, shop rent, and taxes are excluded.',
  };
}
