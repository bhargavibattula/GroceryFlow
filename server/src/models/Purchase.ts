import { Schema, model, Document } from 'mongoose';

export interface IPurchaseLineItem {
  productId: Schema.Types.ObjectId;
  productNameSnapshot: string;
  quantity: number;
  purchaseUnit: string;
  conversionFactor: number;
  baseQuantity: number;
  unitPurchaseCost: number;
  lineDiscount: number;
  allocatedExpenses: number;
  landedCostPerBaseUnit: number;
  netLineCost: number;
}

export interface IAdditionalCosts {
  transportation: number;
  loading: number;
  other: number;
  notes?: string;
}

export interface IPurchase extends Document {
  storeId: Schema.Types.ObjectId;
  supplierId?: Schema.Types.ObjectId;
  supplierNameSnapshot?: string;
  invoiceNumber: string;
  purchasedAt: Date;
  lineItems: IPurchaseLineItem[];
  subtotal: number;
  discountTotal: number;
  additionalCosts: IAdditionalCosts;
  grandTotal: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PARTIAL';
  status: 'RECEIVED' | 'CANCELLED';
  createdBy: Schema.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseLineItemSchema = new Schema<IPurchaseLineItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productNameSnapshot: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    purchaseUnit: { type: String, required: true },
    conversionFactor: { type: Number, required: true, min: 0.0001 },
    baseQuantity: { type: Number, required: true, min: 0.0001 },
    unitPurchaseCost: { type: Number, required: true, min: 0 },
    lineDiscount: { type: Number, default: 0 },
    allocatedExpenses: { type: Number, default: 0 },
    landedCostPerBaseUnit: { type: Number, required: true, min: 0 },
    netLineCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseSchema = new Schema<IPurchase>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier', index: true },
    supplierNameSnapshot: { type: String, default: '' },
    invoiceNumber: { type: String, required: true, trim: true },
    purchasedAt: { type: Date, default: Date.now, index: true },
    lineItems: { type: [PurchaseLineItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    additionalCosts: {
      transportation: { type: Number, default: 0, min: 0 },
      loading: { type: Number, default: 0, min: 0 },
      other: { type: Number, default: 0, min: 0 },
      notes: { type: String, default: '' },
    },
    grandTotal: { type: Number, required: true, min: 0 },
    paymentStatus: { type: String, enum: ['PAID', 'PENDING', 'PARTIAL'], default: 'PAID' },
    status: { type: String, enum: ['RECEIVED', 'CANCELLED'], default: 'RECEIVED' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

PurchaseSchema.index({ storeId: 1, invoiceNumber: 1 });
PurchaseSchema.index({ storeId: 1, purchasedAt: -1 });

export const Purchase = model<IPurchase>('Purchase', PurchaseSchema);
