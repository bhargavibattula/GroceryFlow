import { Schema, model, Document } from 'mongoose';

export interface IPriceHistory extends Document {
  storeId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  oldResellerPrice: number;
  oldRetailPrice: number;
  newResellerPrice: number;
  newRetailPrice: number;
  oldCostBasis: number;
  newCostBasis: number;
  pricingMethod: 'FIXED' | 'COST_PLUS_MARKUP' | 'TARGET_GROSS_MARGIN';
  reason?: string;
  changedBy: Schema.Types.ObjectId;
  createdAt: Date;
}

const PriceHistorySchema = new Schema<IPriceHistory>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    oldResellerPrice: { type: Number, required: true },
    oldRetailPrice: { type: Number, required: true },
    newResellerPrice: { type: Number, required: true },
    newRetailPrice: { type: Number, required: true },
    oldCostBasis: { type: Number, default: 0 },
    newCostBasis: { type: Number, default: 0 },
    pricingMethod: {
      type: String,
      enum: ['FIXED', 'COST_PLUS_MARKUP', 'TARGET_GROSS_MARGIN'],
      required: true,
    },
    reason: { type: String, default: '' },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

PriceHistorySchema.index({ storeId: 1, productId: 1, createdAt: -1 });

export const PriceHistory = model<IPriceHistory>('PriceHistory', PriceHistorySchema);
