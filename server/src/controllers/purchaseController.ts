import { Response } from 'express';
import { z } from 'zod';
import { Purchase } from '../models/Purchase';
import { AuthenticatedRequest } from '../middleware/auth';
import { createPurchase } from '../services/purchaseService';

export const createPurchaseSchema = z.object({
  supplierId: z.string().optional(),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  purchasedAt: z.string().or(z.date()).optional(),
  lineItems: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().positive('Quantity must be greater than 0'),
        purchaseUnit: z.string().min(1),
        conversionFactor: z.number().positive().default(1),
        unitPurchaseCost: z.number().min(0, 'Purchase cost cannot be negative'),
        lineDiscount: z.number().min(0).optional(),
      })
    )
    .min(1, 'At least one line item is required'),
  additionalCosts: z
    .object({
      transportation: z.number().min(0).optional(),
      loading: z.number().min(0).optional(),
      other: z.number().min(0).optional(),
      notes: z.string().optional(),
    })
    .optional(),
  overallDiscount: z.number().min(0).optional(),
  paymentStatus: z.enum(['PAID', 'PENDING', 'PARTIAL']).optional(),
  notes: z.string().optional(),
  updateProductPrices: z.boolean().optional(),
});

export async function getPurchases(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { supplierId, startDate, endDate, page = '1', limit = '30' } = req.query;

  const query: any = { storeId };
  if (supplierId) query.supplierId = supplierId;

  if (startDate || endDate) {
    query.purchasedAt = {};
    if (startDate) query.purchasedAt.$gte = new Date(String(startDate));
    if (endDate) query.purchasedAt.$lte = new Date(String(endDate));
  }

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 30;
  const skip = (pageNum - 1) * limitNum;

  const [purchases, total] = await Promise.all([
    Purchase.find(query)
      .populate('supplierId', 'name phone')
      .populate('createdBy', 'name')
      .sort({ purchasedAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Purchase.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: purchases,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

export async function getPurchaseById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const purchase = await Purchase.findOne({ _id: req.params.id, storeId })
    .populate('supplierId', 'name phone address')
    .populate('createdBy', 'name');

  if (!purchase) {
    res.status(404).json({ success: false, message: 'Purchase not found.' });
    return;
  }

  res.json({ success: true, data: purchase });
}

export async function recordPurchase(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;

  try {
    const purchase = await createPurchase({
      ...req.body,
      storeId,
      userId,
      userName,
      purchasedAt: req.body.purchasedAt ? new Date(req.body.purchasedAt) : new Date(),
    });

    res.status(201).json({
      success: true,
      data: purchase,
      message: 'Purchase recorded and inventory updated successfully.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
