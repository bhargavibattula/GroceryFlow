import { Product } from '../models/Product';
import { InventoryBatch } from '../models/InventoryBatch';
import { InventoryMovement, MovementType } from '../models/InventoryMovement';
import { roundMoney } from '../utils/money';
import { logAudit } from './auditService';

export interface RecordMovementOptions {
  storeId: string;
  productId: string;
  quantityDelta: number; // in base units (+ or -)
  movementType: MovementType;
  referenceType: 'Purchase' | 'Sale' | 'SaleReturn' | 'ManualAdjustment' | 'Damage';
  referenceId?: any;
  reason?: string;
  unitCostBasis?: number;
  userId: string;
  userName?: string;
}

/**
 * Atomically updates product stock and logs an immutable InventoryMovement
 */
export async function recordInventoryMovement(options: RecordMovementOptions) {
  const {
    storeId,
    productId,
    quantityDelta,
    movementType,
    referenceType,
    referenceId,
    reason,
    unitCostBasis,
    userId,
    userName,
  } = options;

  let updatedProduct;

  if (quantityDelta < 0) {
    // Decrement: prevent negative stock if overselling protection is required
    const deduction = Math.abs(quantityDelta);
    updatedProduct = await Product.findOneAndUpdate(
      {
        _id: productId,
        storeId,
        availableQuantity: { $gte: deduction },
      },
      {
        $inc: { availableQuantity: quantityDelta },
      },
      { new: true }
    );

    if (!updatedProduct) {
      const current = await Product.findOne({ _id: productId, storeId });
      const currentStock = current ? current.availableQuantity : 0;
      throw new Error(
        `Insufficient stock for "${current?.name || productId}". Requested: ${deduction} ${
          current?.baseUnit || 'units'
        }, Available: ${currentStock} ${current?.baseUnit || 'units'}.`
      );
    }
  } else {
    // Increment stock
    updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, storeId },
      { $inc: { availableQuantity: quantityDelta } },
      { new: true }
    );

    if (!updatedProduct) {
      throw new Error(`Product not found: ${productId}`);
    }
  }

  // Record movement
  const movement = await InventoryMovement.create({
    storeId,
    productId,
    quantityDelta,
    movementType,
    referenceType,
    referenceId,
    reason: reason || '',
    unitCostBasis: unitCostBasis || updatedProduct.currentCostBasis,
    resultingQuantity: updatedProduct.availableQuantity,
    createdBy: userId,
    createdAt: new Date(),
  });

  return { product: updatedProduct, movement };
}

/**
 * Consumes FIFO batches for a sale to compute exact Cost of Goods Sold (COGS).
 * Returns the weighted-average unitCostBasis for this deduction.
 */
export async function consumeFifoBatchesForSale(
  storeId: string,
  productId: string,
  quantityToConsume: number
): Promise<{ totalCost: number; averageUnitCost: number }> {
  let remainingToDeduct = quantityToConsume;
  let totalCost = 0;

  // Retrieve active batches in FIFO order (oldest first)
  const batches = await InventoryBatch.find({
    storeId,
    productId,
    remainingQuantity: { $gt: 0 },
  }).sort({ receivedAt: 1, _id: 1 });

  for (const batch of batches) {
    if (remainingToDeduct <= 0) break;

    const deductFromBatch = Math.min(batch.remainingQuantity, remainingToDeduct);
    batch.remainingQuantity = roundMoney(batch.remainingQuantity - deductFromBatch, 4);
    await batch.save();

    totalCost += roundMoney(deductFromBatch * batch.unitCost);
    remainingToDeduct = roundMoney(remainingToDeduct - deductFromBatch, 4);
  }

  // If there wasn't enough batch history (e.g. initial stock before purchase entry), use product's currentCostBasis
  if (remainingToDeduct > 0) {
    const product = await Product.findById(productId);
    const fallbackCost = product ? product.currentCostBasis : 0;
    totalCost += roundMoney(remainingToDeduct * fallbackCost);
  }

  const averageUnitCost = quantityToConsume > 0 ? roundMoney(totalCost / quantityToConsume, 4) : 0;
  return { totalCost: roundMoney(totalCost), averageUnitCost };
}

/**
 * Manual stock adjustment with mandatory reason
 */
export async function adjustStockManually({
  storeId,
  productId,
  newQuantity,
  reason,
  userId,
  userName,
}: {
  storeId: string;
  productId: string;
  newQuantity: number;
  reason: string;
  userId: string;
  userName?: string;
}) {
  if (!reason || reason.trim().length === 0) {
    throw new Error('A mandatory reason is required for manual stock adjustments.');
  }

  const product = await Product.findOne({ _id: productId, storeId });
  if (!product) {
    throw new Error('Product not found.');
  }

  const oldQuantity = product.availableQuantity;
  const delta = roundMoney(newQuantity - oldQuantity, 4);

  if (delta === 0) {
    return product;
  }

  product.availableQuantity = roundMoney(newQuantity, 4);
  await product.save();

  await InventoryMovement.create({
    storeId,
    productId,
    quantityDelta: delta,
    movementType: 'MANUAL_ADJUSTMENT',
    referenceType: 'ManualAdjustment',
    reason,
    unitCostBasis: product.currentCostBasis,
    resultingQuantity: product.availableQuantity,
    createdBy: userId,
    createdAt: new Date(),
  });

  await logAudit({
    storeId,
    userId,
    userNameSnapshot: userName,
    action: 'MANUAL_STOCK_ADJUSTMENT',
    entityType: 'InventoryMovement',
    entityId: product._id,
    relevantChanges: {
      oldQuantity,
      newQuantity,
      delta,
      reason,
    },
  });

  return product;
}
