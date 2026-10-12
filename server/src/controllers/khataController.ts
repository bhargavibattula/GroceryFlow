import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth';
import { Account, AccountType } from '../models/Account';
import { LedgerTransaction } from '../models/LedgerTransaction';
import { Payment } from '../models/Payment';
import { Reminder } from '../models/Reminder';
import {
  createAccount,
  postLedgerTransaction,
  reverseLedgerTransaction,
  getKhataDashboardMetrics,
} from '../services/khataService';
import { roundMoney } from '../utils/money';

// ----------------- Accounts -----------------

export async function getAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { type, search, sort = 'recent', active = 'true' } = req.query;

  const query: any = { storeId };
  if (active === 'true') {
    query.active = true;
  } else if (active === 'false') {
    query.active = false;
  }

  if (type && type !== 'ALL') {
    if (type === 'CUSTOMER') {
      query.type = { $in: ['CUSTOMER', 'BOTH'] };
    } else if (type === 'SUPPLIER') {
      query.type = { $in: ['SUPPLIER', 'BOTH'] };
    }
  }

  if (search) {
    const s = String(search).trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
      { businessName: { $regex: s, $options: 'i' } },
    ];
  }

  let sortOption: any = { updatedAt: -1 };
  if (sort === 'balance_desc') {
    sortOption = { currentBalance: -1 };
  } else if (sort === 'balance_asc') {
    sortOption = { currentBalance: 1 };
  } else if (sort === 'name') {
    sortOption = { name: 1 };
  }

  const accounts = await Account.find(query).sort(sortOption);

  res.json({
    success: true,
    data: accounts,
  });
}

export async function getAccountById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const account = await Account.findOne({ _id: req.params.id, storeId });

  if (!account) {
    res.status(404).json({ success: false, message: 'Account not found.' });
    return;
  }

  // Calculate summary metrics
  const transactions = await LedgerTransaction.find({
    storeId,
    accountId: account._id,
    status: 'ACTIVE',
  }).sort({ transactionDate: -1 });

  let totalCredit = 0;
  let totalPayments = 0;

  for (const t of transactions) {
    if (account.type === 'CUSTOMER') {
      if (t.direction === 'DEBIT') totalCredit += t.amount;
      else totalPayments += t.amount;
    } else {
      if (t.direction === 'CREDIT') totalCredit += t.amount;
      else totalPayments += t.amount;
    }
  }

  res.json({
    success: true,
    data: {
      account,
      metrics: {
        currentBalance: account.currentBalance,
        totalCredit: roundMoney(totalCredit),
        totalPayments: roundMoney(totalPayments),
        transactionCount: transactions.length,
        lastTransaction: transactions[0] || null,
      },
    },
  });
}

const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['CUSTOMER', 'SUPPLIER', 'BOTH']),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  businessName: z.string().optional(),
  gstin: z.string().optional(),
  openingBalance: z.number().min(0).optional(),
  openingBalanceDirection: z.enum(['RECEIVABLE', 'PAYABLE', 'ZERO']).optional(),
  creditTermsDays: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export async function createAccountHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;

  try {
    const validated = createAccountSchema.parse(req.body);

    const account = await createAccount({
      ...validated,
      storeId,
      userId,
      userName,
    });

    res.status(201).json({
      success: true,
      data: account,
      message: 'Khata account created successfully.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function updateAccountHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const account = await Account.findOne({ _id: req.params.id, storeId });

  if (!account) {
    res.status(404).json({ success: false, message: 'Account not found.' });
    return;
  }

  const allowedUpdates = ['name', 'phone', 'email', 'address', 'businessName', 'gstin', 'creditTermsDays', 'notes', 'active'];
  for (const key of allowedUpdates) {
    if (req.body[key] !== undefined) {
      (account as any)[key] = req.body[key];
    }
  }

  await account.save();
  res.json({ success: true, data: account, message: 'Account updated successfully.' });
}

export async function getAccountLedger(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { startDate, endDate, limit = 50, page = 1 } = req.query;

  const query: any = { storeId, accountId: req.params.id };
  if (startDate || endDate) {
    query.transactionDate = {};
    if (startDate) query.transactionDate.$gte = new Date(String(startDate));
    if (endDate) query.transactionDate.$lte = new Date(String(endDate));
  }

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [transactions, total] = await Promise.all([
    LedgerTransaction.find(query)
      .sort({ transactionDate: -1, _id: -1 })
      .skip(skip)
      .limit(limitNum),
    LedgerTransaction.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: transactions,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

export async function getAccountStatement(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const account = await Account.findOne({ _id: req.params.id, storeId });
  if (!account) {
    res.status(404).json({ success: false, message: 'Account not found.' });
    return;
  }

  const transactions = await LedgerTransaction.find({
    storeId,
    accountId: account._id,
    status: 'ACTIVE',
  }).sort({ transactionDate: 1, _id: 1 });

  let totalDebit = 0;
  let totalCredit = 0;

  for (const t of transactions) {
    if (t.direction === 'DEBIT') totalDebit += t.amount;
    else totalCredit += t.amount;
  }

  res.json({
    success: true,
    data: {
      account,
      statementGeneratedAt: new Date(),
      openingBalance: account.openingBalance,
      openingBalanceDirection: account.openingBalanceDirection,
      totalDebit: roundMoney(totalDebit),
      totalCredit: roundMoney(totalCredit),
      closingBalance: account.currentBalance,
      transactions,
    },
  });
}

// ----------------- Transactions -----------------

const postTransactionSchema = z.object({
  transactionType: z.enum([
    'OPENING_BALANCE',
    'CREDIT_SALE',
    'PAYMENT_RECEIVED',
    'SALES_RETURN',
    'CREDIT_PURCHASE',
    'PAYMENT_MADE',
    'PURCHASE_RETURN',
    'ADJUSTMENT_DEBIT',
    'ADJUSTMENT_CREDIT',
  ]),
  amount: z.number().positive('Amount must be positive'),
  transactionDate: z.string().or(z.date()).optional(),
  dueDate: z.string().or(z.date()).optional(),
  referenceType: z.enum(['Sale', 'Purchase', 'SaleReturn', 'Payment', 'Manual']).optional(),
  referenceId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']).optional(),
  notes: z.string().optional(),
  attachmentUrl: z.string().optional(),
});

export async function postAccountTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;

  try {
    const validated = postTransactionSchema.parse(req.body);

    const tx = await postLedgerTransaction({
      ...validated,
      storeId,
      accountId: req.params.id,
      transactionDate: validated.transactionDate ? new Date(validated.transactionDate) : new Date(),
      dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      userId,
      userName,
    });

    res.status(201).json({
      success: true,
      data: tx,
      message: 'Transaction recorded successfully.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getRecentTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { limit = 20 } = req.query;

  const transactions = await LedgerTransaction.find({ storeId, status: 'ACTIVE' })
    .populate('accountId', 'name phone type currentBalance')
    .sort({ transactionDate: -1 })
    .limit(parseInt(String(limit), 10) || 20);

  res.json({ success: true, data: transactions });
}

export async function reverseTransactionHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;
  const { reason = 'Transaction reversed by user' } = req.body;

  try {
    const reversed = await reverseLedgerTransaction(storeId, req.params.id, reason, userId, userName);
    res.json({
      success: true,
      data: reversed,
      message: 'Transaction successfully reversed and balance restored.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// ----------------- Payments -----------------

export async function receiveCustomerPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;
  const { accountId, amount, method = 'CASH', referenceNumber = '', notes = '', allocations = [] } = req.body;

  try {
    const cleanAmount = roundMoney(Number(amount));
    if (cleanAmount <= 0) throw new Error('Payment amount must be greater than zero.');

    const payment = await Payment.create({
      storeId,
      accountId,
      paymentDirection: 'INCOMING',
      amount: cleanAmount,
      method,
      referenceNumber,
      paymentDate: new Date(),
      allocations,
      notes,
      createdBy: userId,
    });

    // Record on ledger
    await postLedgerTransaction({
      storeId,
      accountId,
      transactionType: 'PAYMENT_RECEIVED',
      amount: cleanAmount,
      referenceType: 'Payment',
      referenceId: payment._id,
      invoiceNumber: referenceNumber,
      paymentMethod: method,
      notes: notes || `Customer payment via ${method}`,
      userId,
      userName,
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Customer collection recorded successfully.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function paySupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const userName = req.user?.name;
  const { accountId, amount, method = 'CASH', referenceNumber = '', notes = '', allocations = [] } = req.body;

  try {
    const cleanAmount = roundMoney(Number(amount));
    if (cleanAmount <= 0) throw new Error('Payment amount must be greater than zero.');

    const payment = await Payment.create({
      storeId,
      accountId,
      paymentDirection: 'OUTGOING',
      amount: cleanAmount,
      method,
      referenceNumber,
      paymentDate: new Date(),
      allocations,
      notes,
      createdBy: userId,
    });

    // Record on ledger
    await postLedgerTransaction({
      storeId,
      accountId,
      transactionType: 'PAYMENT_MADE',
      amount: cleanAmount,
      referenceType: 'Payment',
      referenceId: payment._id,
      invoiceNumber: referenceNumber,
      paymentMethod: method,
      notes: notes || `Supplier payment via ${method}`,
      userId,
      userName,
    });

    res.status(201).json({
      success: true,
      data: payment,
      message: 'Supplier payment recorded successfully.',
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function getPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { direction, limit = 50 } = req.query;

  const query: any = { storeId };
  if (direction) query.paymentDirection = direction;

  const payments = await Payment.find(query)
    .populate('accountId', 'name phone type')
    .sort({ paymentDate: -1 })
    .limit(parseInt(String(limit), 10) || 50);

  res.json({ success: true, data: payments });
}

// ----------------- Reminders -----------------

export async function getReminders(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const reminders = await Reminder.find({ storeId })
    .populate('accountId', 'name phone currentBalance')
    .sort({ dueDate: 1 });

  res.json({ success: true, data: reminders });
}

export async function createReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const userId = req.auth!.userId;
  const { accountId, amountDue, dueDate, messageText, channel = 'WHATSAPP', relatedInvoice = '' } = req.body;

  try {
    const reminder = await Reminder.create({
      storeId,
      accountId,
      amountDue: roundMoney(Number(amountDue)),
      dueDate: new Date(dueDate),
      messageText,
      channel,
      relatedInvoice,
      status: 'PENDING',
      createdBy: userId,
    });

    res.status(201).json({ success: true, data: reminder, message: 'Reminder created successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
}

export async function sendReminder(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const reminder = await Reminder.findOne({ _id: req.params.id, storeId });

  if (!reminder) {
    res.status(404).json({ success: false, message: 'Reminder not found.' });
    return;
  }

  reminder.status = 'SENT';
  reminder.sentAt = new Date();
  await reminder.save();

  res.json({ success: true, data: reminder, message: 'Reminder marked as sent.' });
}

// ----------------- Dashboard & Reports -----------------

export async function getKhataDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const metrics = await getKhataDashboardMetrics(storeId);
  res.json({ success: true, data: metrics });
}

export async function getOutstandingReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { type = 'ALL' } = req.query;

  const query: any = { storeId, active: true, currentBalance: { $gt: 0 } };
  if (type === 'CUSTOMER') query.type = { $in: ['CUSTOMER', 'BOTH'] };
  else if (type === 'SUPPLIER') query.type = { $in: ['SUPPLIER', 'BOTH'] };

  const accounts = await Account.find(query).sort({ currentBalance: -1 });
  const totalOutstanding = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  res.json({
    success: true,
    data: {
      accounts,
      totalOutstanding: roundMoney(totalOutstanding),
      count: accounts.length,
    },
  });
}

export async function getCollectionsReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { startDate, endDate } = req.query;

  const query: any = { storeId, paymentDirection: 'INCOMING', status: { $ne: 'CANCELLED' } };
  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate) query.paymentDate.$gte = new Date(String(startDate));
    if (endDate) query.paymentDate.$lte = new Date(String(endDate));
  }

  const collections = await Payment.find(query)
    .populate('accountId', 'name phone')
    .sort({ paymentDate: -1 });

  const totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);

  res.json({
    success: true,
    data: {
      collections,
      totalCollected: roundMoney(totalCollected),
      count: collections.length,
    },
  });
}

export async function getSupplierPaymentsReport(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { startDate, endDate } = req.query;

  const query: any = { storeId, paymentDirection: 'OUTGOING', status: { $ne: 'CANCELLED' } };
  if (startDate || endDate) {
    query.paymentDate = {};
    if (startDate) query.paymentDate.$gte = new Date(String(startDate));
    if (endDate) query.paymentDate.$lte = new Date(String(endDate));
  }

  const payments = await Payment.find(query)
    .populate('accountId', 'name phone')
    .sort({ paymentDate: -1 });

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    success: true,
    data: {
      payments,
      totalPaid: roundMoney(totalPaid),
      count: payments.length,
    },
  });
}
