import { Purchase, IPurchase } from '../models/Purchase';
import { Product } from '../models/Product';
import { InventoryBatch } from '../models/InventoryBatch';
import { Supplier } from '../models/Supplier';
import { allocatePurchaseExpenses, PurchaseLineAllocationInput } from '../utils/pricing';
import { recordInventoryMovement } from './inventoryService';
import { roundMoney } from '../utils/money';
import { logAudit } from './auditService';
import { calculateCostPlusPrice, calculateTargetMarginPrice } from '../utils/pricing';

export interface CreatePurchaseLineInput {
  productId: string;
  quantity: number;
  purchaseUnit: string;
  conversionFactor: number; // e.g. 1 bag = 50 kg -> 50
  unitPurchaseCost: number; // cost per purchase unit
  lineDiscount?: number;
}

export interface CreatePurchaseInput {
  storeId: string;
  userId: string;
  userName?: string;
  supplierId?: string;
  invoiceNumber: string;
  purchasedAt?: Date;
  lineItems: CreatePurchaseLineInput[];
  additionalCosts?: {
    transportation?: number;
    loading?: number;
    other?: number;
    notes?: string;
  };
  overallDiscount?: number;
  paymentStatus?: 'PAID' | 'PENDING' | 'PARTIAL';
  notes?: string;
  updateProductPrices?: boolean; // optionally recompute prices based on new landed cost
}

export async function createPurchase(input: CreatePurchaseInput): Promise<IPurchase> {
  const {
    storeId,
    userId,
    userName,
    supplierId,
    invoiceNumber,
    purchasedAt = new Date(),
    lineItems,
    additionalCosts = {},
    overallDiscount = 0,
    paymentStatus = 'PAID',
    notes,
    updateProductPrices = false,
  } = input;

  if (!lineItems || lineItems.length === 0) {
    throw new Error('Purchase must contain at least one line item.');
  }

  // Prevent duplicate invoice number for the same store
  const existing = await Purchase.findOne({ storeId, invoiceNumber });
  if (existing) {
    throw new Error(`A purchase with invoice number "${invoiceNumber}" already exists.`);
  }

  // Retrieve supplier name snapshot if supplierId provided
  let supplierNameSnapshot = '';
  if (supplierId) {
    const supp = await Supplier.findById(supplierId);
    if (supp) supplierNameSnapshot = supp.name;
  }

  const transportation = Number(additionalCosts.transportation || 0);
  const loading = Number(additionalCosts.loading || 0);
  const other = Number(additionalCosts.other || 0);
  const totalAdditionalCosts = roundMoney(transportation + loading + other);

  // Allocate expenses proportionally across line items
  const allocationInput: PurchaseLineAllocationInput[] = lineItems.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    conversionFactor: item.conversionFactor || 1,
    unitPrice: item.unitPurchaseCost,
    lineDiscount: item.lineDiscount || 0,
  }));

  const allocationResult = allocatePurchaseExpenses(
    allocationInput,
    totalAdditionalCosts,
    overallDiscount
  );

  // Build purchase line items with product snapshots
  const purchaseLineItems = [];
  for (let i = 0; i < lineItems.length; i++) {
    const rawLine = lineItems[i];
    const allocated = allocationResult.allocatedLines[i];

    const product = await Product.findOne({ _id: rawLine.productId, storeId });
    if (!product) {
      throw new Error(`Product ${rawLine.productId} not found in this store.`);
    }

    purchaseLineItems.push({
      productId: product._id,
      productNameSnapshot: product.name,
      quantity: rawLine.quantity,
      purchaseUnit: rawLine.purchaseUnit,
      conversionFactor: rawLine.conversionFactor || 1,
      baseQuantity: allocated.baseQuantity,
      unitPurchaseCost: rawLine.unitPurchaseCost,
      lineDiscount: allocated.lineDiscount,
      allocatedExpenses: allocated.allocatedExpenses,
      landedCostPerBaseUnit: allocated.landedCostPerBaseUnit,
      netLineCost: allocated.netLineCost,
    });
  }

  // Save the Purchase document
  const purchase = await Purchase.create({
    storeId,
    supplierId,
    supplierNameSnapshot,
    invoiceNumber,
    purchasedAt,
    lineItems: purchaseLineItems,
    subtotal: allocationResult.subtotal,
    discountTotal: allocationResult.totalDiscount,
    additionalCosts: {
      transportation,
      loading,
      other,
      notes: additionalCosts.notes || '',
    },
    grandTotal: allocationResult.grandTotal,
    paymentStatus,
    status: 'RECEIVED',
    createdBy: userId,
    notes,
  });

  // For each line item: Create InventoryBatch and record inventory movement
  for (const line of purchaseLineItems) {
    // 1. Create batch for FIFO tracking
    await InventoryBatch.create({
      storeId,
      productId: line.productId,
      purchaseId: purchase._id,
      originalQuantity: line.baseQuantity,
      remainingQuantity: line.baseQuantity,
      unitCost: line.landedCostPerBaseUnit,
      receivedAt: purchasedAt,
      supplierId,
    });

    // 2. Increment stock atomically
    const { product } = await recordInventoryMovement({
      storeId,
      productId: line.productId.toString(),
      quantityDelta: line.baseQuantity,
      movementType: 'PURCHASE_RECEIPT',
      referenceType: 'Purchase',
      referenceId: purchase._id,
      reason: `Bulk Purchase Invoice #${invoiceNumber}`,
      unitCostBasis: line.landedCostPerBaseUnit,
      userId,
      userName,
    });

    // 3. Update product's currentCostBasis (weighted average with remaining quantity)
    const existingStock = Math.max(0, product.availableQuantity - line.baseQuantity);
    const totalNewStock = product.availableQuantity;
    const weightedCost =
      totalNewStock > 0
        ? roundMoney(
            (existingStock * product.currentCostBasis + line.baseQuantity * line.landedCostPerBaseUnit) /
              totalNewStock,
            4
          )
        : line.landedCostPerBaseUnit;

    product.currentCostBasis = weightedCost;

    // If requested, update selling prices based on the configured pricing rule
    if (updateProductPrices && product.pricingConfiguration) {
      const { method, resellerMarkupPercent, retailMarkupPercent, resellerMarginPercent, retailMarginPercent } =
        product.pricingConfiguration;
      if (method === 'COST_PLUS_MARKUP') {
        product.resellerPrice = calculateCostPlusPrice(weightedCost, resellerMarkupPercent).price;
        product.retailPrice = calculateCostPlusPrice(weightedCost, retailMarkupPercent).price;
      } else if (method === 'TARGET_GROSS_MARGIN') {
        product.resellerPrice = calculateTargetMarginPrice(weightedCost, resellerMarginPercent).price;
        product.retailPrice = calculateTargetMarginPrice(weightedCost, retailMarginPercent).price;
      }
    }

    await product.save();
  }

  await logAudit({
    storeId,
    userId,
    userNameSnapshot: userName,
    action: 'RECORD_PURCHASE',
    entityType: 'Purchase',
    entityId: purchase._id,
    relevantChanges: {
      invoiceNumber,
      grandTotal: purchase.grandTotal,
      linesCount: purchaseLineItems.length,
    },
  });

  return purchase;
}
