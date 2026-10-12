import { Schema, model, Document } from 'mongoose';

export interface IPaymentAllocation {
  invoiceReference: string;
  allocatedAmount: number;
  referenceId?: Schema.Types.ObjectId;
}

export interface IPayment extends Document {
  storeId: Schema.Types.ObjectId;
  accountId: Schema.Types.ObjectId;
  paymentDirection: 'INCOMING' | 'OUTGOING';
  amount: number;
  method: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';
  referenceNumber?: string;
  paymentDate: Date;
  allocations: IPaymentAllocation[];
  unallocatedAmount: number;
  status: 'RECORDED' | 'VERIFIED' | 'CANCELLED';
  notes?: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentAllocationSchema = new Schema<IPaymentAllocation>(
  {
    invoiceReference: { type: String, required: true, trim: true },
    allocatedAmount: { type: Number, required: true, min: 0 },
    referenceId: { type: Schema.Types.ObjectId },
  },
  { _id: false }
);

const PaymentSchema = new Schema<IPayment>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    paymentDirection: { type: String, enum: ['INCOMING', 'OUTGOING'], required: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'],
      default: 'CASH',
    },
    referenceNumber: { type: String, default: '', trim: true },
    paymentDate: { type: Date, default: Date.now, index: true },
    allocations: { type: [PaymentAllocationSchema], default: [] },
    unallocatedAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['RECORDED', 'VERIFIED', 'CANCELLED'],
      default: 'RECORDED',
    },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

PaymentSchema.index({ storeId: 1, paymentDate: -1 });

export const Payment = model<IPayment>('Payment', PaymentSchema);
