import { Schema, model, Document } from 'mongoose';

export interface IReturnLineItem {
  productId: Schema.Types.ObjectId;
  productNameSnapshot: string;
  returnedQuantity: number; // in base units
  unitRefundPrice: number;
  lineRefundTotal: number;
  restockedQuantity: number; // returned to sellable stock
  damagedQuantity: number; // written off as damage
  reason: string;
}

export interface ISaleReturn extends Document {
  storeId: Schema.Types.ObjectId;
  saleId: Schema.Types.ObjectId;
  saleNumberSnapshot: string;
  lineItems: IReturnLineItem[];
  refundTotal: number;
  paymentMethod: 'CASH' | 'UPI' | 'ORIGINAL_METHOD';
  processedBy: Schema.Types.ObjectId;
  notes?: string;
  createdAt: Date;
}

const ReturnLineItemSchema = new Schema<IReturnLineItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productNameSnapshot: { type: String, required: true },
    returnedQuantity: { type: Number, required: true, min: 0.0001 },
    unitRefundPrice: { type: Number, required: true, min: 0 },
    lineRefundTotal: { type: Number, required: true, min: 0 },
    restockedQuantity: { type: Number, default: 0, min: 0 },
    damagedQuantity: { type: Number, default: 0, min: 0 },
    reason: { type: String, default: 'Customer Return' },
  },
  { _id: false }
);

const SaleReturnSchema = new Schema<ISaleReturn>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale', required: true, index: true },
    saleNumberSnapshot: { type: String, required: true },
    lineItems: { type: [ReturnLineItemSchema], required: true },
    refundTotal: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, enum: ['CASH', 'UPI', 'ORIGINAL_METHOD'], default: 'CASH' },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

export const SaleReturn = model<ISaleReturn>('SaleReturn', SaleReturnSchema);
