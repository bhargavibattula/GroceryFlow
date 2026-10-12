import { Schema, model, Document } from 'mongoose';

export interface ISaleLineItem {
  productId: Schema.Types.ObjectId;
  productNameSnapshot: string;
  quantity: number; // in base units
  sellingUnit: string;
  conversionFactor: number;
  unitPrice: number; // price charged per unit
  discount: number;
  lineTotal: number;
  unitCostBasis: number; // allocated cost of goods per base unit
  priceType: 'RESELLER' | 'RETAIL';
}

export interface IPaymentDetails {
  method: 'CASH' | 'UPI' | 'CARD' | 'SPLIT';
  upiReference?: string;
  notes?: string;
  cashAmount?: number;
  digitalAmount?: number;
}

export interface ISale extends Document {
  storeId: Schema.Types.ObjectId;
  saleNumber: string;
  customerType: 'RESELLER' | 'RETAIL';
  customerName?: string;
  customerPhone?: string;
  lineItems: ISaleLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  totalCostBasis: number; // sum of (unitCostBasis * quantity) for gross profit calculation
  estimatedGrossProfit: number; // total - totalCostBasis
  paymentStatus: 'PAID' | 'PENDING' | 'SPLIT';
  paymentDetails: IPaymentDetails;
  status: 'COMPLETED' | 'CANCELLED' | 'REFUNDED_PARTIAL' | 'REFUNDED_FULL';
  idempotencyKey?: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SaleLineItemSchema = new Schema<ISaleLineItem>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productNameSnapshot: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0.0001 },
    sellingUnit: { type: String, required: true },
    conversionFactor: { type: Number, required: true, min: 0.0001 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    unitCostBasis: { type: Number, required: true, min: 0 },
    priceType: { type: String, enum: ['RESELLER', 'RETAIL'], required: true },
  },
  { _id: false }
);

const SaleSchema = new Schema<ISale>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    saleNumber: { type: String, required: true, trim: true },
    customerType: { type: String, enum: ['RESELLER', 'RETAIL'], required: true },
    customerName: { type: String, default: 'Walk-in Customer' },
    customerPhone: { type: String, default: '' },
    lineItems: { type: [SaleLineItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discountTotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    totalCostBasis: { type: Number, required: true, default: 0 },
    estimatedGrossProfit: { type: Number, required: true, default: 0 },
    paymentStatus: { type: String, enum: ['PAID', 'PENDING', 'SPLIT'], default: 'PAID' },
    paymentDetails: {
      method: { type: String, enum: ['CASH', 'UPI', 'CARD', 'SPLIT'], default: 'CASH' },
      upiReference: { type: String, default: '' },
      notes: { type: String, default: '' },
      cashAmount: { type: Number, default: 0 },
      digitalAmount: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'CANCELLED', 'REFUNDED_PARTIAL', 'REFUNDED_FULL'],
      default: 'COMPLETED',
      index: true,
    },
    idempotencyKey: { type: String, trim: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

SaleSchema.index({ storeId: 1, saleNumber: 1 }, { unique: true });
SaleSchema.index({ storeId: 1, createdAt: -1 });

export const Sale = model<ISale>('Sale', SaleSchema);
