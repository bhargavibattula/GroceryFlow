import { Product, IProduct } from '../models/Product';
import { PriceHistory } from '../models/PriceHistory';
import {
  calculateCostPlusPrice,
  calculateTargetMarginPrice,
  evaluateFixedPrice,
  PricingMethod,
  PricingCalculationResult,
} from '../utils/pricing';
import { roundMoney } from '../utils/money';
import { logAudit } from './auditService';

export interface PreviewPricingInput {
  costBasis: number;
  method: PricingMethod;
  resellerMarkupPercent?: number;
  retailMarkupPercent?: number;
  resellerMarginPercent?: number;
  retailMarginPercent?: number;
  manualResellerPrice?: number;
  manualRetailPrice?: number;
  minSellingPrice?: number;
}

export interface PreviewPricingOutput {
  method: PricingMethod;
  costBasis: number;
  reseller: PricingCalculationResult;
  retail: PricingCalculationResult;
  minSellingPrice?: number;
  warning?: string;
}

export function previewPriceCalculation(input: PreviewPricingInput): PreviewPricingOutput {
  const {
    costBasis,
    method,
    resellerMarkupPercent = 10,
    retailMarkupPercent = 25,
    resellerMarginPercent = 10,
    retailMarginPercent = 20,
    manualResellerPrice,
    manualRetailPrice,
    minSellingPrice = 0,
  } = input;

  let resellerResult: PricingCalculationResult;
  let retailResult: PricingCalculationResult;

  if (method === 'FIXED') {
    const resPrice = manualResellerPrice !== undefined ? manualResellerPrice : costBasis * 1.1;
    const retPrice = manualRetailPrice !== undefined ? manualRetailPrice : costBasis * 1.25;
    resellerResult = evaluateFixedPrice(costBasis, resPrice);
    retailResult = evaluateFixedPrice(costBasis, retPrice);
  } else if (method === 'COST_PLUS_MARKUP') {
    resellerResult = calculateCostPlusPrice(costBasis, resellerMarkupPercent);
    retailResult = calculateCostPlusPrice(costBasis, retailMarkupPercent);
  } else if (method === 'TARGET_GROSS_MARGIN') {
    resellerResult = calculateTargetMarginPrice(costBasis, resellerMarginPercent);
    retailResult = calculateTargetMarginPrice(costBasis, retailMarginPercent);
  } else {
    throw new Error(`Unsupported pricing method: ${method}`);
  }

  let warning: string | undefined;
  if (minSellingPrice > 0) {
    if (resellerResult.price < minSellingPrice || retailResult.price < minSellingPrice) {
      warning = `Calculated price is lower than configured minimum selling price of ₹${minSellingPrice}`;
    }
  }

  return {
    method,
    costBasis: roundMoney(costBasis),
    reseller: resellerResult,
    retail: retailResult,
    minSellingPrice: roundMoney(minSellingPrice),
    warning,
  };
}

export async function updateProductPricing({
  productId,
  storeId,
  userId,
  userName,
  method,
  resellerMarkupPercent,
  retailMarkupPercent,
  resellerMarginPercent,
  retailMarginPercent,
  manualResellerPrice,
  manualRetailPrice,
  minSellingPrice,
  reason,
}: {
  productId: string;
  storeId: string;
  userId: string;
  userName?: string;
  method: PricingMethod;
  resellerMarkupPercent?: number;
  retailMarkupPercent?: number;
  resellerMarginPercent?: number;
  retailMarginPercent?: number;
  manualResellerPrice?: number;
  manualRetailPrice?: number;
  minSellingPrice?: number;
  reason?: string;
}): Promise<IProduct> {
  const product = await Product.findOne({ _id: productId, storeId });
  if (!product) {
    throw new Error('Product not found in this store');
  }

  const oldResellerPrice = product.resellerPrice;
  const oldRetailPrice = product.retailPrice;
  const oldCostBasis = product.currentCostBasis;

  const preview = previewPriceCalculation({
    costBasis: product.currentCostBasis,
    method,
    resellerMarkupPercent: resellerMarkupPercent ?? product.pricingConfiguration.resellerMarkupPercent,
    retailMarkupPercent: retailMarkupPercent ?? product.pricingConfiguration.retailMarkupPercent,
    resellerMarginPercent: resellerMarginPercent ?? product.pricingConfiguration.resellerMarginPercent,
    retailMarginPercent: retailMarginPercent ?? product.pricingConfiguration.retailMarginPercent,
    manualResellerPrice,
    manualRetailPrice,
    minSellingPrice: minSellingPrice !== undefined ? minSellingPrice : product.pricingConfiguration.minSellingPrice,
  });

  const newResellerPrice = preview.reseller.price;
  const newRetailPrice = preview.retail.price;

  // Update product pricing config & prices
  product.pricingConfiguration = {
    method,
    resellerMarkupPercent: resellerMarkupPercent ?? product.pricingConfiguration.resellerMarkupPercent,
    retailMarkupPercent: retailMarkupPercent ?? product.pricingConfiguration.retailMarkupPercent,
    resellerMarginPercent: resellerMarginPercent ?? product.pricingConfiguration.resellerMarginPercent,
    retailMarginPercent: retailMarginPercent ?? product.pricingConfiguration.retailMarginPercent,
    minSellingPrice: minSellingPrice !== undefined ? minSellingPrice : product.pricingConfiguration.minSellingPrice,
  };
  product.resellerPrice = newResellerPrice;
  product.retailPrice = newRetailPrice;
  await product.save();

  // Save audit log & price history
  await PriceHistory.create({
    storeId,
    productId: product._id,
    oldResellerPrice,
    oldRetailPrice,
    newResellerPrice,
    newRetailPrice,
    oldCostBasis,
    newCostBasis: product.currentCostBasis,
    pricingMethod: method,
    reason: reason || 'Price updated by owner',
    changedBy: userId,
    createdAt: new Date(),
  });

  await logAudit({
    storeId,
    userId,
    userNameSnapshot: userName,
    action: 'PRICE_UPDATE',
    entityType: 'Price',
    entityId: product._id,
    relevantChanges: {
      old: { resellerPrice: oldResellerPrice, retailPrice: oldRetailPrice },
      new: { resellerPrice: newResellerPrice, retailPrice: newRetailPrice },
      method,
      reason,
    },
  });

  return product;
}
