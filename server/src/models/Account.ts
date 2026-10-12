import { Schema, model, Document } from 'mongoose';

export type AccountType = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';
export type OpeningBalanceDirection = 'RECEIVABLE' | 'PAYABLE' | 'ZERO';

export interface IAccount extends Document {
  storeId: Schema.Types.ObjectId;
  name: string;
  type: AccountType;
  phone: string;
  email?: string;
  address?: string;
  businessName?: string;
  gstin?: string;
  openingBalance: number;
  openingBalanceDirection: OpeningBalanceDirection;
  openingBalanceDate: Date;
  creditTermsDays: number;
  currentBalance: number; // For Customer: >0 means Customer owes shop (receivable), <0 means Advance. For Supplier: >0 means Shop owes supplier (payable), <0 means Advance paid to supplier.
  notes?: string;
  active: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['CUSTOMER', 'SUPPLIER', 'BOTH'], default: 'CUSTOMER', index: true },
    phone: { type: String, default: '', trim: true },
    email: { type: String, default: '', trim: true, lowercase: true },
    address: { type: String, default: '', trim: true },
    businessName: { type: String, default: '', trim: true },
    gstin: { type: String, default: '', trim: true },
    openingBalance: { type: Number, default: 0, min: 0 },
    openingBalanceDirection: {
      type: String,
      enum: ['RECEIVABLE', 'PAYABLE', 'ZERO'],
      default: 'ZERO',
    },
    openingBalanceDate: { type: Date, default: Date.now },
    creditTermsDays: { type: Number, default: 15 },
    currentBalance: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    active: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

AccountSchema.index({ storeId: 1, name: 1 });
AccountSchema.index({ storeId: 1, phone: 1 });
AccountSchema.index({ storeId: 1, type: 1, active: 1 });

export const Account = model<IAccount>('Account', AccountSchema);
