import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getDashboardSummary } from '../services/dashboardService';
import { Sale } from '../models/Sale';
import { Purchase } from '../models/Purchase';
import { Product } from '../models/Product';
import { roundMoney } from '../utils/money';

export async function getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const isOwner = req.auth!.role === 'OWNER';

  const summary = await getDashboardSummary(storeId);

  // If salesperson, sanitize cost/profit numbers
  if (!isOwner) {
    const { inventoryValuationAtCost, todayEstimatedGrossProfit, ...publicOverview } = summary.overview;
    res.json({
      success: true,
      data: {
        ...summary,
        overview: publicOverview,
      },
    });
    return;
  }

  res.json({ success: true, data: summary });
}

export async function getSalesReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { startDate, endDate, groupBy = 'day' } = req.query;

  const query: any = { storeId, status: { $ne: 'CANCELLED' } };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(String(startDate));
    if (endDate) query.createdAt.$lte = new Date(String(endDate));
  }

  const sales = await Sale.find(query).sort({ createdAt: 1 });

  let totalSalesAmount = 0;
  let resellerTotal = 0;
  let retailTotal = 0;
  let totalDiscounts = 0;
  const paymentMethodBreakdown: Record<string, number> = {
    CASH: 0,
    UPI: 0,
    CARD: 0,
    SPLIT: 0,
  };

  sales.forEach((s) => {
    totalSalesAmount += s.total;
    totalDiscounts += s.discountTotal;
    if (s.customerType === 'RESELLER') {
      resellerTotal += s.total;
    } else {
      retailTotal += s.total;
    }
    const method = s.paymentDetails?.method || 'CASH';
    paymentMethodBreakdown[method] = (paymentMethodBreakdown[method] || 0) + s.total;
  });

  res.json({
    success: true,
    data: {
      totalSalesCount: sales.length,
      totalSalesAmount: roundMoney(totalSalesAmount, 2),
      resellerTotal: roundMoney(resellerTotal, 2),
      retailTotal: roundMoney(retailTotal, 2),
      totalDiscounts: roundMoney(totalDiscounts, 2),
      paymentMethodBreakdown,
      salesList: sales.slice(-20),
    },
  });
}

export async function getProfitReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { startDate, endDate } = req.query;

  const query: any = { storeId, status: { $ne: 'CANCELLED' } };
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(String(startDate));
    if (endDate) query.createdAt.$lte = new Date(String(endDate));
  }

  const sales = await Sale.find(query);

  let totalRevenue = 0;
  let totalCogs = 0;
  let totalEstimatedGrossProfit = 0;

  sales.forEach((s) => {
    totalRevenue += s.total;
    totalCogs += s.totalCostBasis;
    totalEstimatedGrossProfit += s.estimatedGrossProfit;
  });

  const overallGrossMarginPercent =
    totalRevenue > 0 ? roundMoney((totalEstimatedGrossProfit / totalRevenue) * 100, 2) : 0;

  res.json({
    success: true,
    data: {
      totalRevenue: roundMoney(totalRevenue, 2),
      totalCogs: roundMoney(totalCogs, 2),
      totalEstimatedGrossProfit: roundMoney(totalEstimatedGrossProfit, 2),
      overallGrossMarginPercent,
      salesAnalyzed: sales.length,
      costingMethod: 'FIFO Batch Costing',
      disclaimer: 'Gross profit excludes store rent, employee wages, utilities, and tax liabilities.',
    },
  });
}

export async function getInventoryReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const products = await Product.find({ storeId, active: true }).populate('categoryId', 'name');

  let totalValuation = 0;
  let totalUnits = 0;
  const categorySummary: Record<string, { count: number; valuation: number; units: number }> = {};

  products.forEach((p) => {
    const val = roundMoney(p.availableQuantity * p.currentCostBasis);
    totalValuation += val;
    totalUnits += p.availableQuantity;

    const catName = (p.categoryId as any)?.name || 'Uncategorized';
    if (!categorySummary[catName]) {
      categorySummary[catName] = { count: 0, valuation: 0, units: 0 };
    }
    categorySummary[catName].count++;
    categorySummary[catName].valuation = roundMoney(categorySummary[catName].valuation + val);
    categorySummary[catName].units = roundMoney(categorySummary[catName].units + p.availableQuantity);
  });

  res.json({
    success: true,
    data: {
      totalValuation: roundMoney(totalValuation, 2),
      totalUnits: roundMoney(totalUnits, 2),
      categorySummary,
      productsCount: products.length,
    },
  });
}
