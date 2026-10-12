import { Schema, model, Document } from 'mongoose';

export type LedgerTransactionType =
  | 'OPENING_BALANCE'
  | 'CREDIT_SALE'
  | 'PAYMENT_RECEIVED'
  | 'SALES_RETURN'
  | 'CREDIT_PURCHASE'
  | 'PAYMENT_MADE'
  | 'PURCHASE_RETURN'
  | 'ADJUSTMENT_DEBIT'
  | 'ADJUSTMENT_CREDIT';

export type EntryDirection = 'DEBIT' | 'CREDIT';

export interface ILedgerTransaction extends Document {
  storeId: Schema.Types.ObjectId;
  accountId: Schema.Types.ObjectId;
  transactionType: LedgerTransactionType;
  direction: EntryDirection;
  amount: number;
  runningBalance: number;
  transactionDate: Date;
  dueDate?: Date;
  referenceType?: 'Sale' | 'Purchase' | 'SaleReturn' | 'Payment' | 'Manual';
  referenceId?: Schema.Types.ObjectId;
  invoiceNumber?: string;
  paymentMethod?: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';
  notes?: string;
  attachmentUrl?: string;
  status: 'ACTIVE' | 'REVERSED';
  reversedAt?: Date;
  reversalReason?: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerTransactionSchema = new Schema<ILedgerTransaction>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    transactionType: {
      type: String,
      enum: [
        'OPENING_BALANCE',
        'CREDIT_SALE',
        'PAYMENT_RECEIVED',
        'SALES_RETURN',
        'CREDIT_PURCHASE',
        'PAYMENT_MADE',
        'PURCHASE_RETURN',
        'ADJUSTMENT_DEBIT',
        'ADJUSTMENT_CREDIT',
      ],
      required: true,
      index: true,
    },
    direction: { type: String, enum: ['DEBIT', 'CREDIT'], required: true },
    amount: { type: Number, required: true, min: 0 },
    runningBalance: { type: Number, required: true },
    transactionDate: { type: Date, default: Date.now, index: true },
    dueDate: { type: Date, index: true },
    referenceType: {
      type: String,
      enum: ['Sale', 'Purchase', 'SaleReturn', 'Payment', 'Manual'],
      default: 'Manual',
    },
    referenceId: { type: Schema.Types.ObjectId },
    invoiceNumber: { type: String, default: '', trim: true },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'],
      default: 'CASH',
    },
    notes: { type: String, default: '' },
    attachmentUrl: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'REVERSED'], default: 'ACTIVE', index: true },
    reversedAt: { type: Date },
    reversalReason: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

LedgerTransactionSchema.index({ storeId: 1, accountId: 1, transactionDate: -1 });
LedgerTransactionSchema.index({ storeId: 1, dueDate: 1 });

export const LedgerTransaction = model<ILedgerTransaction>('LedgerTransaction', LedgerTransactionSchema);
