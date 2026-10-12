import { Sale } from '../models/Sale';
import { SaleReturn, ISaleReturn, IReturnLineItem } from '../models/SaleReturn';
import { recordInventoryMovement } from './inventoryService';
import { roundMoney } from '../utils/money';
import { logAudit } from './auditService';

export interface ReturnItemInput {
  productId: string;
  returnedQuantity: number;
  restockedQuantity: number;
  damagedQuantity: number;
  reason?: string;
}

export interface ProcessReturnInput {
  storeId: string;
  saleId: string;
  items: ReturnItemInput[];
  paymentMethod?: 'CASH' | 'UPI' | 'ORIGINAL_METHOD';
  notes?: string;
  userId: string;
  userName?: string;
}

export async function processSaleReturn(input: ProcessReturnInput): Promise<ISaleReturn> {
  const { storeId, saleId, items, paymentMethod = 'CASH', notes, userId, userName } = input;

  const sale = await Sale.findOne({ _id: saleId, storeId });
  if (!sale) {
    throw new Error('Sale not found in this store.');
  }

  if (sale.status === 'CANCELLED') {
    throw new Error('Cannot return items from a cancelled sale.');
  }

  // Find previous returns for this sale to ensure returnable quantity limit
  const previousReturns = await SaleReturn.find({ storeId, saleId });
  const alreadyReturnedMap = new Map<string, number>();

  previousReturns.forEach((ret) => {
    ret.lineItems.forEach((li) => {
      const pid = li.productId.toString();
      alreadyReturnedMap.set(pid, (alreadyReturnedMap.get(pid) || 0) + li.returnedQuantity);
    });
  });

  const processedReturnLines: IReturnLineItem[] = [];
  let totalRefund = 0;

  for (const item of items) {
    const saleLine = sale.lineItems.find((l) => l.productId.toString() === item.productId);
    if (!saleLine) {
      throw new Error(`Product ${item.productId} was not part of original sale #${sale.saleNumber}.`);
    }

    const previousReturned = alreadyReturnedMap.get(item.productId) || 0;
    const returnable = roundMoney(saleLine.quantity - previousReturned, 4);

    if (item.returnedQuantity > returnable) {
      throw new Error(
        `Cannot return ${item.returnedQuantity} of ${saleLine.productNameSnapshot}. Max returnable: ${returnable}.`
      );
    }

    if (item.restockedQuantity + item.damagedQuantity !== item.returnedQuantity) {
      throw new Error('Sum of restocked and damaged quantities must equal returned quantity.');
    }

    const effectiveUnitPrice = roundMoney(saleLine.lineTotal / saleLine.quantity, 2);
    const lineRefund = roundMoney(effectiveUnitPrice * item.returnedQuantity, 2);
    totalRefund += lineRefund;

    // If restocked, increase inventory atomically
    if (item.restockedQuantity > 0) {
      await recordInventoryMovement({
        storeId,
        productId: item.productId,
        quantityDelta: item.restockedQuantity,
        movementType: 'CUSTOMER_RETURN',
        referenceType: 'SaleReturn',
        referenceId: sale._id,
        reason: `Restocked from Return on Sale #${sale.saleNumber}`,
        unitCostBasis: saleLine.unitCostBasis,
        userId,
        userName,
      });
    }

    // If damaged, record damage movement (stock is not added to sellable, but movement is tracked)
    if (item.damagedQuantity > 0) {
      // Stock was already deducted at sale, so damaged goods don't re-enter sellable inventory
      await recordInventoryMovement({
        storeId,
        productId: item.productId,
        quantityDelta: 0, // no change to available stock, but movement recorded
        movementType: 'DAMAGE_SPOILAGE',
        referenceType: 'Damage',
        referenceId: sale._id,
        reason: `Damaged item returned on Sale #${sale.saleNumber}`,
        unitCostBasis: saleLine.unitCostBasis,
        userId,
        userName,
      });
    }

    processedReturnLines.push({
      productId: saleLine.productId,
      productNameSnapshot: saleLine.productNameSnapshot,
      returnedQuantity: item.returnedQuantity,
      unitRefundPrice: effectiveUnitPrice,
      lineRefundTotal: lineRefund,
      restockedQuantity: item.restockedQuantity,
      damagedQuantity: item.damagedQuantity,
      reason: item.reason || 'Customer Return',
    });
  }

  const saleReturn = await SaleReturn.create({
    storeId,
    saleId: sale._id,
    saleNumberSnapshot: sale.saleNumber,
    lineItems: processedReturnLines,
    refundTotal: roundMoney(totalRefund),
    paymentMethod,
    processedBy: userId,
    notes,
  });

  // Update sale status if fully or partially returned
  let totalOriginalQty = 0;
  sale.lineItems.forEach((li) => (totalOriginalQty += li.quantity));

  let totalCumulativeReturned = 0;
  sale.lineItems.forEach((li) => {
    const pid = li.productId.toString();
    const currItemReturned = items.find((i) => i.productId === pid)?.returnedQuantity || 0;
    totalCumulativeReturned += (alreadyReturnedMap.get(pid) || 0) + currItemReturned;
  });

  if (totalCumulativeReturned >= totalOriginalQty) {
    sale.status = 'REFUNDED_FULL';
  } else {
    sale.status = 'REFUNDED_PARTIAL';
  }
  await sale.save();

  await logAudit({
    storeId,
    userId,
    userNameSnapshot: userName,
    action: 'PROCESS_RETURN',
    entityType: 'SaleReturn',
    entityId: saleReturn._id,
    relevantChanges: {
      saleNumber: sale.saleNumber,
      refundTotal: saleReturn.refundTotal,
    },
  });

  return saleReturn;
}
