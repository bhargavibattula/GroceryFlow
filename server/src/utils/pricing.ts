import { roundMoney } from './money';

export type PricingMethod = 'FIXED' | 'COST_PLUS_MARKUP' | 'TARGET_GROSS_MARGIN';

export interface PricingCalculationResult {
  price: number;
  grossProfitPerUnit: number;
  grossMarginPercent: number;
  markupPercent: number;
}

/**
 * Calculates selling price using Cost-Plus Markup:
 * Price = Cost * (1 + Markup% / 100)
 */
export function calculateCostPlusPrice(unitCost: number, markupPercent: number): PricingCalculationResult {
  if (unitCost < 0) throw new Error('Unit cost cannot be negative');
  if (markupPercent < 0) throw new Error('Markup percentage cannot be negative');

  const price = roundMoney(unitCost * (1 + markupPercent / 100));
  const grossProfitPerUnit = roundMoney(price - unitCost);
  const grossMarginPercent = price > 0 ? roundMoney((grossProfitPerUnit / price) * 100) : 0;

  return {
    price,
    grossProfitPerUnit,
    grossMarginPercent,
    markupPercent: roundMoney(markupPercent),
  };
}

/**
 * Calculates selling price using Target Gross Margin:
 * Price = Cost / (1 - Margin% / 100)
 * Note: Gross margin >= 100% is mathematically impossible / rejected.
 */
export function calculateTargetMarginPrice(unitCost: number, marginPercent: number): PricingCalculationResult {
  if (unitCost < 0) throw new Error('Unit cost cannot be negative');
  if (marginPercent >= 100) {
    throw new Error('Target gross margin must be strictly less than 100%');
  }
  if (marginPercent < 0) {
    throw new Error('Gross margin percentage cannot be negative');
  }

  const denominator = 1 - marginPercent / 100;
  const price = roundMoney(unitCost / denominator);
  const grossProfitPerUnit = roundMoney(price - unitCost);
  const markupPercent = unitCost > 0 ? roundMoney((grossProfitPerUnit / unitCost) * 100) : 0;

  return {
    price,
    grossProfitPerUnit,
    grossMarginPercent: roundMoney(marginPercent),
    markupPercent,
  };
}

/**
 * Evaluates metrics for an existing fixed price
 */
export function evaluateFixedPrice(unitCost: number, fixedPrice: number): PricingCalculationResult {
  if (unitCost < 0) throw new Error('Unit cost cannot be negative');
  if (fixedPrice < 0) throw new Error('Price cannot be negative');

  const grossProfitPerUnit = roundMoney(fixedPrice - unitCost);
  const grossMarginPercent = fixedPrice > 0 ? roundMoney((grossProfitPerUnit / fixedPrice) * 100) : 0;
  const markupPercent = unitCost > 0 ? roundMoney((grossProfitPerUnit / unitCost) * 100) : 0;

  return {
    price: roundMoney(fixedPrice),
    grossProfitPerUnit,
    grossMarginPercent,
    markupPercent,
  };
}

/**
 * Line item expense allocation for bulk purchases:
 * Allocates shared transport and additional expenses proportionally based on line item value.
 */
export interface PurchaseLineAllocationInput {
  productId: string;
  quantity: number;
  conversionFactor: number; // e.g. 1 bag = 50 kg -> factor is 50
  unitPrice: number; // price per purchase unit (e.g. ₹1500 per 50kg bag)
  lineDiscount?: number;
}

export interface PurchaseLineAllocatedOutput {
  productId: string;
  quantity: number;
  baseQuantity: number; // quantity * conversionFactor
  lineSubtotal: number;
  lineDiscount: number;
  allocatedExpenses: number;
  netLineCost: number;
  landedCostPerBaseUnit: number;
}

export function allocatePurchaseExpenses(
  items: PurchaseLineAllocationInput[],
  additionalExpenses: number = 0,
  overallDiscount: number = 0
): {
  subtotal: number;
  totalDiscount: number;
  additionalExpenses: number;
  grandTotal: number;
  allocatedLines: PurchaseLineAllocatedOutput[];
} {
  const lineSubtotals = items.map((item) => roundMoney(item.quantity * item.unitPrice));
  const subtotal = roundMoney(lineSubtotals.reduce((sum, val) => sum + val, 0));

  let itemDiscountsSum = 0;
  items.forEach((item) => {
    itemDiscountsSum += roundMoney(item.lineDiscount || 0);
  });
  const totalDiscount = roundMoney(itemDiscountsSum + overallDiscount);

  const grandTotal = roundMoney(Math.max(0, subtotal - totalDiscount + additionalExpenses));

  // Proportional expense and overall discount distribution
  let remainingExpensesToAllocate = additionalExpenses;
  let remainingOverallDiscount = overallDiscount;

  const allocatedLines: PurchaseLineAllocatedOutput[] = items.map((item, idx) => {
    const itemSub = lineSubtotals[idx];
    const baseQuantity = roundMoney(item.quantity * (item.conversionFactor || 1), 4);
    if (baseQuantity <= 0) {
      throw new Error(`Base quantity must be greater than 0 for product ${item.productId}`);
    }

    const proportion = subtotal > 0 ? itemSub / subtotal : 1 / items.length;
    
    // For last item, take remainder to guarantee exact pennies
    const isLast = idx === items.length - 1;
    const allocatedExp = isLast 
      ? roundMoney(remainingExpensesToAllocate) 
      : roundMoney(additionalExpenses * proportion);
    remainingExpensesToAllocate -= allocatedExp;

    const allocatedOverDiscount = isLast
      ? roundMoney(remainingOverallDiscount)
      : roundMoney(overallDiscount * proportion);
    remainingOverallDiscount -= allocatedOverDiscount;

    const totalLineDiscount = roundMoney((item.lineDiscount || 0) + allocatedOverDiscount);
    const netLineCost = roundMoney(Math.max(0, itemSub - totalLineDiscount + allocatedExp));
    const landedCostPerBaseUnit = roundMoney(netLineCost / baseQuantity, 4);

    return {
      productId: item.productId,
      quantity: item.quantity,
      baseQuantity,
      lineSubtotal: itemSub,
      lineDiscount: totalLineDiscount,
      allocatedExpenses: allocatedExp,
      netLineCost,
      landedCostPerBaseUnit,
    };
  });

  return {
    subtotal,
    totalDiscount,
    additionalExpenses: roundMoney(additionalExpenses),
    grandTotal,
    allocatedLines,
  };
}
