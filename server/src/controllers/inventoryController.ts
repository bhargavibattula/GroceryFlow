import { Response } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { InventoryMovement } from '../models/InventoryMovement';
import { AuthenticatedRequest } from '../middleware/auth';
import { adjustStockManually } from '../services/inventoryService';
import { roundMoney } from '../utils/money';

export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  newQuantity: z.number().min(0, 'Quantity cannot be negative'),
  reason: z.string().min(3, 'A clear reason is required for manual stock adjustment'),
});

export async function getInventorySummary(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const isOwner = req.auth!.role === 'OWNER' || req.auth!.permissions.includes('view_costs');

  const products = await Product.find({ storeId, active: true });

  let totalItems = products.length;
  let totalStockQuantity = 0;
  let totalValuation = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;

  products.forEach((p) => {
    totalStockQuantity += p.availableQuantity;
    if (isOwner) {
      totalValuation += roundMoney(p.availableQuantity * p.currentCostBasis);
    }
    if (p.availableQuantity <= 0) {
      outOfStockCount++;
    } else if (p.availableQuantity <= p.lowStockThreshold) {
      lowStockCount++;
    }
  });

  res.json({
    success: true,
    data: {
      totalItems,
      totalStockQuantity: roundMoney(totalStockQuantity, 2),
      totalValuation: isOwner ? roundMoney(totalValuation, 2) : undefined,
      lowStockCount,
      outOfStockCount,
    },
  });
}

export async function getInventoryMovements(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const isOwner = req.auth!.role === 'OWNER' || req.auth!.permissions.includes('view_costs');
  const { productId, movementType, startDate, endDate, page = '1', limit = '50' } = req.query;

  const query: any = { storeId };
  if (productId) query.productId = productId;
  if (movementType) query.movementType = movementType;

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(String(startDate));
    if (endDate) query.createdAt.$lte = new Date(String(endDate));
  }

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [movements, total] = await Promise.all([
    InventoryMovement.find(query)
      .populate('productId', 'name sku baseUnit')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    InventoryMovement.countDocuments(query),
  ]);

  const sanitized = movements.map((m) => {
    if (!isOwner) {
      const { unitCostBasis, ...rest } = m;
      return rest;
    }
    return m;
  });

  res.json({
    success: true,
    data: sanitized,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

export async function getLowStockProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const isOwner = req.auth!.role === 'OWNER' || req.auth!.permissions.includes('view_costs');

  const products = await Product.find({
    storeId,
    active: true,
    $expr: { $lte: ['$availableQuantity', '$lowStockThreshold'] },
  })
    .populate('categoryId', 'name')
    .sort({ availableQuantity: 1 })
    .lean();

  const sanitized = products.map((p) => {
    if (!isOwner) {
      const { currentCostBasis, ...rest } = p;
      return rest;
    }
    return p;
  });

  res.json({ success: true, data: sanitized });
}

export async function adjustStock(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;

  try {
    const product = await adjustStockManually({
      storeId,
      productId: req.body.productId,
      newQuantity: req.body.newQuantity,
      reason: req.body.reason,
      userId,
      userName,
    });

    res.json({
      success: true,
      data: product,
      message: 'Stock adjusted and audit movement recorded successfully.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
