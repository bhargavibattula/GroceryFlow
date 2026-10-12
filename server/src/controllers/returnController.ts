import { Response } from 'express';
import { z } from 'zod';
import { SaleReturn } from '../models/SaleReturn';
import { AuthenticatedRequest } from '../middleware/auth';
import { processSaleReturn } from '../services/returnsService';

export const processReturnSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        returnedQuantity: z.number().positive(),
        restockedQuantity: z.number().min(0),
        damagedQuantity: z.number().min(0),
        reason: z.string().optional(),
      })
    )
    .min(1, 'At least one return item must be provided'),
  paymentMethod: z.enum(['CASH', 'UPI', 'ORIGINAL_METHOD']).default('CASH'),
  notes: z.string().optional(),
});

export async function createReturn(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;

  try {
    const saleReturn = await processSaleReturn({
      storeId,
      saleId: req.params.id,
      items: req.body.items,
      paymentMethod: req.body.paymentMethod,
      notes: req.body.notes,
      userId,
      userName,
    });

    res.status(201).json({
      success: true,
      data: saleReturn,
      message: `Return recorded successfully. Refund: ₹${saleReturn.refundTotal}`,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getReturns(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { saleId, page = '1', limit = '30' } = req.query;

  const query: any = { storeId };
  if (saleId) query.saleId = saleId;

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 30;
  const skip = (pageNum - 1) * limitNum;

  const [returns, total] = await Promise.all([
    SaleReturn.find(query)
      .populate('processedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    SaleReturn.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: returns,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}
