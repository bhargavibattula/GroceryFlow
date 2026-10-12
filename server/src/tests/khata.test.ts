import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Supplier } from '../models/Supplier';
import { Account } from '../models/Account';
import { LedgerTransaction } from '../models/LedgerTransaction';
import { Payment } from '../models/Payment';
import {
  createAccount,
  postLedgerTransaction,
  reverseLedgerTransaction,
  getKhataDashboardMetrics,
} from '../services/khataService';
import { createPurchase } from '../services/purchaseService';
import { createSale } from '../services/salesService';

describe('Khata Book (Bahi Khata) Business Logic & Integrations', () => {
  let mongoServer: MongoMemoryServer;
  let testStoreId: string;
  let testUserId: string;
  let testProduct: any;
  let testSupplier: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const store = await Store.create({
      name: 'Bhargavi Kirana Stores',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    });
    testStoreId = store._id.toString();

    const user = await User.create({
      name: 'Store Owner',
      email: 'owner@kirana.test',
      username: 'kiranaowner',
      passwordHash: 'hash123',
      role: 'OWNER',
      storeId: store._id,
      active: true,
    });
    testUserId = user._id.toString();

    const category = await Category.create({
      storeId: store._id,
      name: 'Grains & Rice',
    });

    testProduct = await Product.create({
      storeId: store._id,
      sku: 'RICE-25KG',
      name: 'Sona Masoori Rice 25kg',
      categoryId: category._id,
      baseUnit: 'kg',
      resellerPrice: 55,
      retailPrice: 62,
      currentCostBasis: 45,
      availableQuantity: 100,
    });

    testSupplier = await Supplier.create({
      storeId: store._id,
      name: 'Sri Lakshmi Rice Mills',
      phone: '9876543210',
      address: 'Guntur, AP',
    });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('1. Creates customer account with opening receivable balance', async () => {
    const acc = await createAccount({
      storeId: testStoreId,
      name: 'Ramesh Kirana Reseller',
      type: 'CUSTOMER',
      phone: '9123456780',
      openingBalance: 1500,
      openingBalanceDirection: 'RECEIVABLE',
      userId: testUserId,
    });

    expect(acc.currentBalance).toBe(1500);

    const txs = await LedgerTransaction.find({ storeId: testStoreId, accountId: acc._id });
    expect(txs.length).toBe(1);
    expect(txs[0].transactionType).toBe('OPENING_BALANCE');
    expect(txs[0].amount).toBe(1500);
    expect(txs[0].runningBalance).toBe(1500);
  });

  it('2. Records supplier purchase with partial payment (Inventory up, Supplier balance up by unpaid portion)', async () => {
    // Dad purchases 100 kg at ₹42/kg = ₹4,200. Pays ₹2,000 immediately. Unpaid = ₹2,200.
    const initialStock = testProduct.availableQuantity;

    const purchase = await createPurchase({
      storeId: testStoreId,
      userId: testUserId,
      supplierId: testSupplier._id.toString(),
      invoiceNumber: 'INV-PUR-001',
      lineItems: [
        {
          productId: testProduct._id.toString(),
          quantity: 100,
          purchaseUnit: 'kg',
          conversionFactor: 1,
          unitPurchaseCost: 42,
        },
      ],
      amountPaidImmediately: 2000,
      paymentStatus: 'PARTIAL',
    });

    expect(purchase.grandTotal).toBe(4200);

    // Verify stock increased by 100 kg
    const updatedProduct = await Product.findById(testProduct._id);
    expect(updatedProduct?.availableQuantity).toBe(initialStock + 100);

    // Verify supplier Khata balance
    const supplierAccount = await Account.findOne({ storeId: testStoreId, name: testSupplier.name });
    expect(supplierAccount).toBeDefined();
    // 4200 credit purchase - 2000 paid = 2200 outstanding payable
    expect(supplierAccount?.currentBalance).toBe(2200);

    const supplierTxs = await LedgerTransaction.find({ storeId: testStoreId, accountId: supplierAccount?._id }).sort({
      createdAt: 1,
    });
    expect(supplierTxs.length).toBe(2);
    expect(supplierTxs[0].transactionType).toBe('CREDIT_PURCHASE');
    expect(supplierTxs[0].amount).toBe(4200);
    expect(supplierTxs[1].transactionType).toBe('PAYMENT_MADE');
    expect(supplierTxs[1].amount).toBe(2000);
    expect(supplierTxs[1].runningBalance).toBe(2200);
  });

  it('3. Subsequent supplier payment reduces payable without changing stock', async () => {
    const supplierAccount = await Account.findOne({ storeId: testStoreId, name: testSupplier.name });
    const productBeforePayment = await Product.findById(testProduct._id);
    const stockBefore = productBeforePayment?.availableQuantity;

    // Dad pays ₹1,000 later to the supplier
    await postLedgerTransaction({
      storeId: testStoreId,
      accountId: supplierAccount!._id.toString(),
      transactionType: 'PAYMENT_MADE',
      amount: 1000,
      paymentMethod: 'UPI',
      notes: 'Paid via PhonePe',
      userId: testUserId,
    });

    const refreshedAccount = await Account.findById(supplierAccount!._id);
    // Was 2200, minus 1000 = 1200
    expect(refreshedAccount?.currentBalance).toBe(1200);

    // Verify inventory did NOT change
    const productAfterPayment = await Product.findById(testProduct._id);
    expect(productAfterPayment?.availableQuantity).toBe(stockBefore);
  });

  it('4. Customer credit sale decreases stock and updates customer receivable', async () => {
    const productBefore = await Product.findById(testProduct._id);
    const stockBefore = productBefore!.availableQuantity;

    // Sell 10 kg on credit to Ramesh Kirana (Retail price = 62 -> ₹620)
    const sale = await createSale({
      storeId: testStoreId,
      userId: testUserId,
      customerType: 'RETAIL',
      customerName: 'Ramesh Kirana Reseller',
      customerPhone: '9123456780',
      lineItems: [
        {
          productId: testProduct._id.toString(),
          quantity: 10,
          sellingUnit: 'kg',
          conversionFactor: 1,
        },
      ],
      paymentDetails: {
        method: 'CASH',
        notes: 'Credit sale - pay next week',
        cashAmount: 0,
        digitalAmount: 0,
      },
      isCreditSale: true,
      creditAmount: 620,
    });

    expect(sale.total).toBe(620);

    // Verify stock decreased by 10 kg
    const productAfter = await Product.findById(testProduct._id);
    expect(productAfter!.availableQuantity).toBe(stockBefore - 10);

    // Verify Ramesh's balance: was 1500 opening + 620 credit sale = 2120
    const ramesh = await Account.findOne({ storeId: testStoreId, phone: '9123456780' });
    expect(ramesh?.currentBalance).toBe(2120);
  });

  it('5. Customer payment collection settles dues without touching stock', async () => {
    const ramesh = await Account.findOne({ storeId: testStoreId, phone: '9123456780' });
    const productBefore = await Product.findById(testProduct._id);
    const stockBefore = productBefore!.availableQuantity;

    // Ramesh pays ₹2,120 in full via UPI
    await postLedgerTransaction({
      storeId: testStoreId,
      accountId: ramesh!._id.toString(),
      transactionType: 'PAYMENT_RECEIVED',
      amount: 2120,
      paymentMethod: 'UPI',
      notes: 'GPay payment from Ramesh',
      userId: testUserId,
    });

    const refreshedRamesh = await Account.findById(ramesh!._id);
    expect(refreshedRamesh?.currentBalance).toBe(0);

    // Stock remained intact
    const productAfter = await Product.findById(testProduct._id);
    expect(productAfter!.availableQuantity).toBe(stockBefore);
  });

  it('6. Khata dashboard aggregates correct totals', async () => {
    const metrics = await getKhataDashboardMetrics(testStoreId);
    expect(metrics).toBeDefined();
    expect(metrics.totalSupplierPayables).toBe(1200); // Sri Lakshmi supplier
    expect(metrics.totalCustomerReceivables).toBe(0); // Ramesh fully paid
    expect(metrics.topSuppliers.length).toBeGreaterThan(0);
    expect(metrics.recentTransactions.length).toBeGreaterThan(0);
  });

  it('7. Reversal process restores ledger balance safely', async () => {
    // Add an adjustment
    const supplierAccount = await Account.findOne({ storeId: testStoreId, name: testSupplier.name });
    const balBefore = supplierAccount!.currentBalance;

    const tx = await postLedgerTransaction({
      storeId: testStoreId,
      accountId: supplierAccount!._id.toString(),
      transactionType: 'CREDIT_PURCHASE',
      amount: 500,
      notes: 'Accidental duplicate entry',
      userId: testUserId,
    });

    const accAfter = await Account.findById(supplierAccount!._id);
    expect(accAfter!.currentBalance).toBe(balBefore + 500);

    // Now reverse it
    await reverseLedgerTransaction(
      testStoreId,
      tx._id.toString(),
      'Correction: duplicate entry removed',
      testUserId
    );

    const accRestored = await Account.findById(supplierAccount!._id);
    expect(accRestored!.currentBalance).toBe(balBefore);
  });
});
