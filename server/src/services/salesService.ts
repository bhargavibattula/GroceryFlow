import { Sale, ISale, ISaleLineItem, IPaymentDetails } from '../models/Sale';
import { Product } from '../models/Product';
import { consumeFifoBatchesForSale, recordInventoryMovement } from './inventoryService';
import { roundMoney } from '../utils/money';
import { logAudit } from './auditService';
import { findOrCreateAccountForCustomer, postLedgerTransaction } from './khataService';
import { Payment } from '../models/Payment';

export interface CreateSaleLineInput {
  productId: string;
  quantity: number; // number of selling units (e.g. 2 bags, or 5 kg)
  sellingUnit: string;
  conversionFactor?: number; // e.g. 1 bag = 50 kg -> 50
  discount?: number; // line discount in ₹
}

export interface CreateSaleInput {
  storeId: string;
  userId: string;
  userName?: string;
  customerType: 'RESELLER' | 'RETAIL';
  customerName?: string;
  customerPhone?: string;
  lineItems: CreateSaleLineInput[];
  overallDiscount?: number;
  paymentDetails: IPaymentDetails;
  idempotencyKey?: string;
  isCreditSale?: boolean;
  paymentStatus?: 'PAID' | 'PENDING' | 'SPLIT';
  creditAmount?: number;
  dueDate?: Date | string;
}

export async function generateSaleNumber(storeId: string): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ''); // e.g. 20261012

  // Count sales created today
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const countToday = await Sale.countDocuments({
    storeId,
    createdAt: { $gte: startOfDay },
  });

  const seq = (countToday + 1).toString().padStart(4, '0');
  return `FS-${dateStr}-${seq}`;
}

export async function createSale(input: CreateSaleInput): Promise<ISale> {
  const {
    storeId,
    userId,
    userName,
    customerType,
    customerName = 'Walk-in Customer',
    customerPhone = '',
    lineItems,
    overallDiscount = 0,
    paymentDetails,
    idempotencyKey,
    isCreditSale = false,
    paymentStatus: explicitPaymentStatus,
    creditAmount = 0,
    dueDate,
  } = input;

  if (!lineItems || lineItems.length === 0) {
    throw new Error('Sale must contain at least one line item.');
  }

  // Idempotency check: if sale already created with this key, return it immediately
  if (idempotencyKey) {
    const existingSale = await Sale.findOne({ storeId, idempotencyKey });
    if (existingSale) {
      return existingSale;
    }
  }

  const processedLines: ISaleLineItem[] = [];
  let subtotal = 0;
  let totalLineDiscounts = 0;
  let totalCostBasis = 0;

  // Step 1: Pre-validate stock availability for all items before any deduction
  for (const item of lineItems) {
    const product = await Product.findOne({ _id: item.productId, storeId, active: true });
    if (!product) {
      throw new Error(`Product not found or inactive: ${item.productId}`);
    }

    const convFactor = item.conversionFactor || 1;
    const baseQuantity = roundMoney(item.quantity * convFactor, 4);

    if (product.availableQuantity < baseQuantity) {
      throw new Error(
        `Insufficient stock for "${product.name}". Available: ${product.availableQuantity} ${product.baseUnit}, Requested: ${baseQuantity} ${product.baseUnit}.`
      );
    }
  }

  // Step 2: Process deductions and batch consumption
  for (const item of lineItems) {
    const product = await Product.findOne({ _id: item.productId, storeId });
    if (!product) throw new Error('Product not found');

    const convFactor = item.conversionFactor || 1;
    const baseQuantity = roundMoney(item.quantity * convFactor, 4);

    // Pick applicable unit price: Reseller vs Retail
    const unitPrice = customerType === 'RESELLER' ? product.resellerPrice : product.retailPrice;
    const lineSubtotal = roundMoney(item.quantity * unitPrice);
    const lineDiscount = roundMoney(item.discount || 0);
    const lineTotal = roundMoney(Math.max(0, lineSubtotal - lineDiscount));

    // Consume FIFO batches to compute exact COGS
    const { totalCost: cogsForLine, averageUnitCost } = await consumeFifoBatchesForSale(
      storeId,
      item.productId,
      baseQuantity
    );

    // Atomically decrement stock
    await recordInventoryMovement({
      storeId,
      productId: item.productId,
      quantityDelta: -baseQuantity,
      movementType: 'SALE',
      referenceType: 'Sale',
      reason: `Sale ${customerType}`,
      unitCostBasis: averageUnitCost,
      userId,
      userName,
    });

    subtotal += lineSubtotal;
    totalLineDiscounts += lineDiscount;
    totalCostBasis += cogsForLine;

    processedLines.push({
      productId: product._id as any,
      productNameSnapshot: product.name,
      quantity: baseQuantity,
      sellingUnit: item.sellingUnit,
      conversionFactor: convFactor,
      unitPrice,
      discount: lineDiscount,
      lineTotal,
      unitCostBasis: averageUnitCost,
      priceType: customerType,
    });
  }

  const grandDiscount = roundMoney(totalLineDiscounts + (overallDiscount || 0));
  const finalTotal = roundMoney(Math.max(0, subtotal - grandDiscount));
  const estimatedGrossProfit = roundMoney(finalTotal - totalCostBasis);

  const saleNumber = await generateSaleNumber(storeId);

  // Validate payment details
  const method = paymentDetails.method || 'CASH';
  const isFullCredit = isCreditSale && (!paymentDetails.cashAmount && !paymentDetails.digitalAmount);
  const cashAmount =
    paymentDetails.cashAmount !== undefined
      ? paymentDetails.cashAmount
      : method === 'CASH' && !isFullCredit
      ? finalTotal
      : 0;
  const digitalAmount =
    paymentDetails.digitalAmount !== undefined
      ? paymentDetails.digitalAmount
      : (method === 'UPI' || method === 'CARD') && !isFullCredit
      ? finalTotal
      : 0;
  const totalPaidNow = roundMoney(cashAmount + digitalAmount);

  let paymentStatus: 'PAID' | 'PENDING' | 'SPLIT' = 'PAID';
  if (explicitPaymentStatus) {
    paymentStatus = explicitPaymentStatus;
  } else if (isCreditSale || creditAmount > 0) {
    if (totalPaidNow === 0 || creditAmount >= finalTotal) {
      paymentStatus = 'PENDING';
    } else {
      paymentStatus = 'SPLIT';
    }
  } else if (paymentDetails.notes?.includes('Pending')) {
    paymentStatus = 'PENDING';
  }

  const sale = await Sale.create({
    storeId,
    saleNumber,
    customerType,
    customerName,
    customerPhone,
    lineItems: processedLines,
    subtotal: roundMoney(subtotal),
    discountTotal: grandDiscount,
    taxTotal: 0,
    total: finalTotal,
    totalCostBasis: roundMoney(totalCostBasis),
    estimatedGrossProfit,
    paymentStatus,
    paymentDetails: {
      method,
      upiReference: paymentDetails.upiReference || '',
      notes: paymentDetails.notes || '',
      cashAmount,
      digitalAmount,
    },
    status: 'COMPLETED',
    idempotencyKey,
    createdBy: userId,
  });

  await logAudit({
    storeId,
    userId,
    userNameSnapshot: userName,
    action: 'COMPLETE_SALE',
    entityType: 'Sale',
    entityId: sale._id,
    relevantChanges: {
      saleNumber,
      customerType,
      total: finalTotal,
      itemsCount: processedLines.length,
      estimatedGrossProfit,
      paymentStatus,
    },
  });

  // Khata Book Integration: If credit sale, post to customer ledger
  try {
    if (isCreditSale || creditAmount > 0 || paymentStatus !== 'PAID') {
      const customerAccount = await findOrCreateAccountForCustomer(
        storeId,
        customerName,
        customerPhone,
        userId
      );

      // 1. Post Credit Sale on Ledger
      await postLedgerTransaction({
        storeId,
        accountId: customerAccount._id.toString(),
        transactionType: 'CREDIT_SALE',
        amount: finalTotal,
        transactionDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        referenceType: 'Sale',
        referenceId: sale._id,
        invoiceNumber: saleNumber,
        notes: `Credit Sale #${saleNumber} (${customerType})`,
        userId,
        userName,
      });

      // 2. If customer paid a portion now, record payment received
      if (totalPaidNow > 0) {
        await Payment.create({
          storeId,
          accountId: customerAccount._id,
          paymentDirection: 'INCOMING',
          amount: totalPaidNow,
          method: method as any,
          referenceNumber: saleNumber,
          paymentDate: new Date(),
          allocations: [{ invoiceReference: saleNumber, allocatedAmount: totalPaidNow, referenceId: sale._id }],
          notes: `Partial payment received during checkout for #${saleNumber}`,
          createdBy: userId,
        });

        await postLedgerTransaction({
          storeId,
          accountId: customerAccount._id.toString(),
          transactionType: 'PAYMENT_RECEIVED',
          amount: totalPaidNow,
          transactionDate: new Date(),
          referenceType: 'Payment',
          referenceId: sale._id,
          invoiceNumber: saleNumber,
          paymentMethod: method as any,
          notes: `Immediate payment received at checkout`,
          userId,
          userName,
        });
      }
    }
  } catch (khataError) {
    console.warn('[Sale Khata] Error syncing credit sale to ledger:', khataError);
  }

  return sale;
}

