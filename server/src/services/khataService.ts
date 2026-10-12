import { Schema } from 'mongoose';
import { Account, IAccount, AccountType, OpeningBalanceDirection } from '../models/Account';
import { LedgerTransaction, ILedgerTransaction, LedgerTransactionType, EntryDirection } from '../models/LedgerTransaction';
import { Payment, IPayment } from '../models/Payment';
import { Reminder, IReminder } from '../models/Reminder';
import { roundMoney } from '../utils/money';
import { logAudit } from './auditService';

export interface CreateAccountInput {
  storeId: string;
  name: string;
  type: AccountType;
  phone?: string;
  email?: string;
  address?: string;
  businessName?: string;
  gstin?: string;
  openingBalance?: number;
  openingBalanceDirection?: OpeningBalanceDirection;
  creditTermsDays?: number;
  notes?: string;
  userId: string;
  userName?: string;
}

export async function createAccount(input: CreateAccountInput): Promise<IAccount> {
  const {
    storeId,
    name,
    type,
    phone = '',
    email = '',
    address = '',
    businessName = '',
    gstin = '',
    openingBalance = 0,
    openingBalanceDirection = 'ZERO',
    creditTermsDays = 15,
    notes = '',
    userId,
    userName,
  } = input;

  const cleanOpeningBalance = roundMoney(Math.max(0, openingBalance));
  let initialBalance = 0;

  if (cleanOpeningBalance > 0) {
    if (type === 'CUSTOMER') {
      initialBalance = openingBalanceDirection === 'RECEIVABLE' ? cleanOpeningBalance : -cleanOpeningBalance;
    } else {
      // SUPPLIER
      initialBalance = openingBalanceDirection === 'PAYABLE' ? cleanOpeningBalance : -cleanOpeningBalance;
    }
  }

  const account = await Account.create({
    storeId,
    name,
    type,
    phone,
    email,
    address,
    businessName,
    gstin,
    openingBalance: cleanOpeningBalance,
    openingBalanceDirection: cleanOpeningBalance > 0 ? openingBalanceDirection : 'ZERO',
    openingBalanceDate: new Date(),
    creditTermsDays,
    currentBalance: initialBalance,
    notes,
    createdBy: userId,
  });

  // If opening balance > 0, post initial ledger transaction
  if (cleanOpeningBalance > 0) {
    const isCustomer = type === 'CUSTOMER';
    const direction: EntryDirection =
      (isCustomer && openingBalanceDirection === 'RECEIVABLE') || (!isCustomer && openingBalanceDirection !== 'PAYABLE')
        ? 'DEBIT'
        : 'CREDIT';

    await LedgerTransaction.create({
      storeId,
      accountId: account._id,
      transactionType: 'OPENING_BALANCE',
      direction,
      amount: cleanOpeningBalance,
      runningBalance: initialBalance,
      transactionDate: new Date(),
      notes: 'Initial Opening Balance',
      referenceType: 'Manual',
      createdBy: userId,
    });
  }

  await logAudit({
    storeId: storeId as any,
    userId: userId as any,
    userNameSnapshot: userName,
    action: 'CREATE_KHATA_ACCOUNT',
    entityType: 'User' as any,
    entityId: account._id as any,
    relevantChanges: { name, type, phone, openingBalance: cleanOpeningBalance },
  });

  return account;
}

export interface PostTransactionInput {
  storeId: string;
  accountId: string;
  transactionType: LedgerTransactionType;
  amount: number;
  transactionDate?: Date;
  dueDate?: Date;
  referenceType?: 'Sale' | 'Purchase' | 'SaleReturn' | 'Payment' | 'Manual';
  referenceId?: any;
  invoiceNumber?: string;
  paymentMethod?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';
  notes?: string;
  attachmentUrl?: string;
  userId: string;
  userName?: string;
}

export async function postLedgerTransaction(input: PostTransactionInput): Promise<ILedgerTransaction> {
  const {
    storeId,
    accountId,
    transactionType,
    amount,
    transactionDate = new Date(),
    dueDate,
    referenceType = 'Manual',
    referenceId,
    invoiceNumber = '',
    paymentMethod = 'CASH',
    notes = '',
    attachmentUrl = '',
    userId,
    userName,
  } = input;

  if (amount <= 0) {
    throw new Error('Transaction amount must be greater than zero.');
  }

  const account = await Account.findOne({ _id: accountId, storeId });
  if (!account) {
    throw new Error('Khata account not found.');
  }

  const cleanAmount = roundMoney(amount);
  const isCustomer = account.type === 'CUSTOMER';

  let direction: EntryDirection = 'DEBIT';
  let balanceDelta = 0;

  if (isCustomer) {
    // Customer conventions:
    // Receivable increases (DEBIT): CREDIT_SALE, ADJUSTMENT_DEBIT
    // Receivable decreases (CREDIT): PAYMENT_RECEIVED, SALES_RETURN, ADJUSTMENT_CREDIT
    if (transactionType === 'CREDIT_SALE' || transactionType === 'ADJUSTMENT_DEBIT') {
      direction = 'DEBIT';
      balanceDelta = cleanAmount;
    } else {
      direction = 'CREDIT';
      balanceDelta = -cleanAmount;
    }
  } else {
    // Supplier conventions:
    // Payable increases (CREDIT): CREDIT_PURCHASE, ADJUSTMENT_CREDIT
    // Payable decreases (DEBIT): PAYMENT_MADE, PURCHASE_RETURN, ADJUSTMENT_DEBIT
    if (transactionType === 'CREDIT_PURCHASE' || transactionType === 'ADJUSTMENT_CREDIT') {
      direction = 'CREDIT';
      balanceDelta = cleanAmount;
    } else {
      direction = 'DEBIT';
      balanceDelta = -cleanAmount;
    }
  }

  const newRunningBalance = roundMoney(account.currentBalance + balanceDelta);

  const tx = await LedgerTransaction.create({
    storeId,
    accountId: account._id,
    transactionType,
    direction,
    amount: cleanAmount,
    runningBalance: newRunningBalance,
    transactionDate,
    dueDate,
    referenceType,
    referenceId,
    invoiceNumber,
    paymentMethod,
    notes,
    attachmentUrl,
    status: 'ACTIVE',
    createdBy: userId,
  });

  account.currentBalance = newRunningBalance;
  await account.save();

  await logAudit({
    storeId: storeId as any,
    userId: userId as any,
    userNameSnapshot: userName,
    action: 'POST_LEDGER_TRANSACTION',
    entityType: 'User' as any,
    entityId: tx._id as any,
    relevantChanges: {
      accountName: account.name,
      transactionType,
      amount: cleanAmount,
      newRunningBalance,
      invoiceNumber,
    },
  });

  return tx;
}

export async function reverseLedgerTransaction(
  storeId: string,
  transactionId: string,
  reversalReason: string,
  userId: string,
  userName?: string
): Promise<ILedgerTransaction> {
  const tx = await LedgerTransaction.findOne({ _id: transactionId, storeId, status: 'ACTIVE' });
  if (!tx) {
    throw new Error('Active transaction not found or already reversed.');
  }

  const account = await Account.findOne({ _id: tx.accountId, storeId });
  if (!account) {
    throw new Error('Associated account not found.');
  }

  // Reverse running balance impact
  const isCustomer = account.type === 'CUSTOMER';
  let reversalDelta = 0;

  if (isCustomer) {
    if (tx.transactionType === 'CREDIT_SALE' || tx.transactionType === 'ADJUSTMENT_DEBIT') {
      reversalDelta = -tx.amount;
    } else {
      reversalDelta = tx.amount;
    }
  } else {
    if (tx.transactionType === 'CREDIT_PURCHASE' || tx.transactionType === 'ADJUSTMENT_CREDIT') {
      reversalDelta = -tx.amount;
    } else {
      reversalDelta = tx.amount;
    }
  }

  tx.status = 'REVERSED';
  tx.reversedAt = new Date();
  tx.reversalReason = reversalReason;
  await tx.save();

  account.currentBalance = roundMoney(account.currentBalance + reversalDelta);
  await account.save();

  await logAudit({
    storeId: storeId as any,
    userId: userId as any,
    userNameSnapshot: userName,
    action: 'REVERSE_LEDGER_TRANSACTION',
    entityType: 'User' as any,
    entityId: tx._id as any,
    relevantChanges: {
      accountName: account.name,
      transactionId: tx._id,
      reversalReason,
      newCurrentBalance: account.currentBalance,
    },
  });

  return tx;
}

export async function findOrCreateAccountForCustomer(
  storeId: string,
  name: string,
  phone: string,
  userId: string
): Promise<IAccount> {
  const trimmedName = name.trim();
  const trimmedPhone = phone.trim();

  let account: IAccount | null = null;
  if (trimmedPhone) {
    account = await Account.findOne({ storeId, phone: trimmedPhone, active: true });
  }
  if (!account && trimmedName) {
    account = await Account.findOne({ storeId, name: trimmedName, active: true });
  }

  if (!account) {
    account = await Account.create({
      storeId,
      name: trimmedName || 'Walk-in Customer',
      type: 'CUSTOMER',
      phone: trimmedPhone,
      currentBalance: 0,
      createdBy: userId,
    });
  }

  return account;
}

export async function findOrCreateAccountForSupplier(
  storeId: string,
  supplierId: string | undefined,
  supplierName: string,
  phone: string,
  userId: string
): Promise<IAccount> {
  const trimmedName = (supplierName || 'General Supplier').trim();

  let account: IAccount | null = null;
  if (phone) {
    account = await Account.findOne({ storeId, phone: phone.trim(), active: true });
  }
  if (!account) {
    account = await Account.findOne({ storeId, name: trimmedName, active: true });
  }

  if (!account) {
    account = await Account.create({
      storeId,
      name: trimmedName,
      type: 'SUPPLIER',
      phone: phone || '',
      currentBalance: 0,
      createdBy: userId,
    });
  }

  return account;
}

export async function getKhataDashboardMetrics(storeId: string) {
  const accounts = await Account.find({ storeId, active: true });

  let totalCustomerReceivables = 0;
  let totalSupplierPayables = 0;
  let customersWithDues = 0;
  let suppliersAwaitingPayment = 0;

  for (const acc of accounts) {
    if (acc.type === 'CUSTOMER' || acc.type === 'BOTH') {
      if (acc.currentBalance > 0) {
        totalCustomerReceivables += acc.currentBalance;
        customersWithDues++;
      }
    }
    if (acc.type === 'SUPPLIER' || acc.type === 'BOTH') {
      if (acc.currentBalance > 0) {
        totalSupplierPayables += acc.currentBalance;
        suppliersAwaitingPayment++;
      }
    }
  }

  // Today's collections and supplier payments
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const paymentsToday = await Payment.find({
    storeId,
    paymentDate: { $gte: startOfDay },
    status: { $ne: 'CANCELLED' },
  });

  let collectedToday = 0;
  let paidToSuppliersToday = 0;

  for (const p of paymentsToday) {
    if (p.paymentDirection === 'INCOMING') {
      collectedToday += p.amount;
    } else {
      paidToSuppliersToday += p.amount;
    }
  }

  // Overdue count check
  const now = new Date();
  const overdueTxs = await LedgerTransaction.find({
    storeId,
    status: 'ACTIVE',
    dueDate: { $lt: now },
  });

  const overdueReceivablesCount = overdueTxs.filter((t) => t.direction === 'DEBIT').length;
  const overduePayablesCount = overdueTxs.filter((t) => t.direction === 'CREDIT').length;

  // Top 5 customers with highest dues
  const topCustomers = await Account.find({
    storeId,
    active: true,
    type: { $in: ['CUSTOMER', 'BOTH'] },
    currentBalance: { $gt: 0 },
  })
    .sort({ currentBalance: -1 })
    .limit(5);

  // Top 5 suppliers with highest payables
  const topSuppliers = await Account.find({
    storeId,
    active: true,
    type: { $in: ['SUPPLIER', 'BOTH'] },
    currentBalance: { $gt: 0 },
  })
    .sort({ currentBalance: -1 })
    .limit(5);

  // Recent 10 transactions
  const recentTransactions = await LedgerTransaction.find({ storeId, status: 'ACTIVE' })
    .populate('accountId', 'name phone type')
    .sort({ transactionDate: -1 })
    .limit(10);

  return {
    totalCustomerReceivables: roundMoney(totalCustomerReceivables),
    totalSupplierPayables: roundMoney(totalSupplierPayables),
    collectedToday: roundMoney(collectedToday),
    paidToSuppliersToday: roundMoney(paidToSuppliersToday),
    customersWithDues,
    suppliersAwaitingPayment,
    overdueReceivablesCount,
    overduePayablesCount,
    topCustomers,
    topSuppliers,
    recentTransactions,
  };
}
