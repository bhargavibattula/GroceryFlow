import { Response } from 'express';
import { z } from 'zod';
import { Sale } from '../models/Sale';
import { AuthenticatedRequest } from '../middleware/auth';
import { createSale } from '../services/salesService';
import { recordInventoryMovement } from '../services/inventoryService';
import { logAudit } from '../services/auditService';

export const createSaleSchema = z.object({
  customerType: z.enum(['RESELLER', 'RETAIL']),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().positive('Quantity must be greater than 0'),
        sellingUnit: z.string().min(1),
        conversionFactor: z.number().positive().default(1),
        discount: z.number().min(0).optional(),
      })
    )
    .min(1, 'Sale must include at least one item'),
  overallDiscount: z.number().min(0).optional(),
  paymentDetails: z.object({
    method: z.enum(['CASH', 'UPI', 'CARD', 'SPLIT']),
    upiReference: z.string().optional(),
    notes: z.string().optional(),
    cashAmount: z.number().min(0).optional(),
    digitalAmount: z.number().min(0).optional(),
  }),
  idempotencyKey: z.string().optional(),
  isCreditSale: z.boolean().optional(),
  paymentStatus: z.enum(['PAID', 'PENDING', 'PARTIAL']).optional(),
  creditAmount: z.number().min(0).optional(),
  dueDate: z.string().or(z.date()).optional(),
});

export async function getSales(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const isOwner = req.auth!.role === 'OWNER' || req.auth!.permissions.includes('view_reports');
  const { search, customerType, status, startDate, endDate, page = '1', limit = '30' } = req.query;

  const query: any = { storeId };
  if (customerType) query.customerType = customerType;
  if (status) query.status = status;

  if (search) {
    const s = String(search).trim();
    query.$or = [
      { saleNumber: { $regex: s, $options: 'i' } },
      { customerName: { $regex: s, $options: 'i' } },
      { customerPhone: { $regex: s, $options: 'i' } },
    ];
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(String(startDate));
    if (endDate) query.createdAt.$lte = new Date(String(endDate));
  }

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 30;
  const skip = (pageNum - 1) * limitNum;

  const [sales, total] = await Promise.all([
    Sale.find(query)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Sale.countDocuments(query),
  ]);

  const sanitized = sales.map((s) => {
    if (!isOwner) {
      const { totalCostBasis, estimatedGrossProfit, lineItems, ...rest } = s;
      const cleanLines = lineItems.map((li) => {
        const { unitCostBasis, ...lineRest } = li;
        return lineRest;
      });
      return { ...rest, lineItems: cleanLines };
    }
    return s;
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

export async function getSaleById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const isOwner = req.auth!.role === 'OWNER' || req.auth!.permissions.includes('view_reports');

  const sale = await Sale.findOne({ _id: req.params.id, storeId })
    .populate('createdBy', 'name')
    .lean();

  if (!sale) {
    res.status(404).json({ success: false, message: 'Sale not found.' });
    return;
  }

  if (!isOwner) {
    const { totalCostBasis, estimatedGrossProfit, lineItems, ...rest } = sale;
    const cleanLines = lineItems.map((li) => {
      const { unitCostBasis, ...lineRest } = li;
      return lineRest;
    });
    res.json({ success: true, data: { ...rest, lineItems: cleanLines } });
    return;
  }

  res.json({ success: true, data: sale });
}

export async function processSale(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;

  try {
    const sale = await createSale({
      ...req.body,
      storeId,
      userId,
      userName,
    });

    res.status(201).json({
      success: true,
      data: sale,
      message: `Sale #${sale.saleNumber} completed successfully.`,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function cancelSale(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;

  const sale = await Sale.findOne({ _id: req.params.id, storeId });
  if (!sale) {
    res.status(404).json({ success: false, message: 'Sale not found.' });
    return;
  }

  if (sale.status === 'CANCELLED') {
    res.status(400).json({ success: false, message: 'Sale is already cancelled.' });
    return;
  }

  // Restore inventory for all items in the cancelled sale
  for (const line of sale.lineItems) {
    await recordInventoryMovement({
      storeId,
      productId: line.productId.toString(),
      quantityDelta: line.quantity,
      movementType: 'CORRECTION_REVERSAL',
      referenceType: 'Sale',
      referenceId: sale._id,
      reason: `Cancellation reversal for Sale #${sale.saleNumber}`,
      unitCostBasis: line.unitCostBasis,
      userId,
      userName,
    });
  }

  sale.status = 'CANCELLED';
  await sale.save();

  await logAudit({
    storeId,
    userId,
    userNameSnapshot: userName,
    action: 'CANCEL_SALE',
    entityType: 'Sale',
    entityId: sale._id,
    relevantChanges: { saleNumber: sale.saleNumber },
  });

  res.json({
    success: true,
    data: sale,
    message: `Sale #${sale.saleNumber} has been cancelled and stock has been restored.`,
  });
}
