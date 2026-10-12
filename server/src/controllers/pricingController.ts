import { Response } from 'express';
import { z } from 'zod';
import { Product } from '../models/Product';
import { AuthenticatedRequest } from '../middleware/auth';
import { previewPriceCalculation, updateProductPricing } from '../services/pricingService';

export const previewPricingSchema = z.object({
  method: z.enum(['FIXED', 'COST_PLUS_MARKUP', 'TARGET_GROSS_MARGIN']),
  resellerMarkupPercent: z.number().min(0).optional(),
  retailMarkupPercent: z.number().min(0).optional(),
  resellerMarginPercent: z.number().min(0).max(99.99).optional(),
  retailMarginPercent: z.number().min(0).max(99.99).optional(),
  manualResellerPrice: z.number().min(0).optional(),
  manualRetailPrice: z.number().min(0).optional(),
  minSellingPrice: z.number().min(0).optional(),
  costBasisOverride: z.number().min(0).optional(),
});

export const updatePricingSchema = previewPricingSchema.extend({
  reason: z.string().optional(),
});

export async function previewPricing(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const product = await Product.findOne({ _id: req.params.id, storeId });

  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found.' });
    return;
  }

  const costBasis = req.body.costBasisOverride !== undefined ? req.body.costBasisOverride : product.currentCostBasis;

  try {
    const preview = previewPriceCalculation({
      costBasis,
      method: req.body.method,
      resellerMarkupPercent: req.body.resellerMarkupPercent,
      retailMarkupPercent: req.body.retailMarkupPercent,
      resellerMarginPercent: req.body.resellerMarginPercent,
      retailMarginPercent: req.body.retailMarginPercent,
      manualResellerPrice: req.body.manualResellerPrice,
      manualRetailPrice: req.body.manualRetailPrice,
      minSellingPrice: req.body.minSellingPrice,
    });

    res.json({
      success: true,
      data: {
        ...preview,
        currentResellerPrice: product.resellerPrice,
        currentRetailPrice: product.retailPrice,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function updatePricing(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;

  try {
    const updated = await updateProductPricing({
      productId: req.params.id,
      storeId,
      userId,
      userName,
      method: req.body.method,
      resellerMarkupPercent: req.body.resellerMarkupPercent,
      retailMarkupPercent: req.body.retailMarkupPercent,
      resellerMarginPercent: req.body.resellerMarginPercent,
      retailMarginPercent: req.body.retailMarginPercent,
      manualResellerPrice: req.body.manualResellerPrice,
      manualRetailPrice: req.body.manualRetailPrice,
      minSellingPrice: req.body.minSellingPrice,
      reason: req.body.reason,
    });

    res.json({ success: true, data: updated, message: 'Prices updated successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}
