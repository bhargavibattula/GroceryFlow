import { Schema, model, Document } from 'mongoose';

export interface IStore extends Document {
  name: string;
  address: string;
  phone: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  pricingDefaults: {
    defaultPricingMethod: 'FIXED' | 'COST_PLUS_MARKUP' | 'TARGET_GROSS_MARGIN';
    resellerMarkupPercent: number;
    retailMarkupPercent: number;
    resellerMarginPercent: number;
    retailMarginPercent: number;
  };
  settings: {
    lowStockAlertsEnabled: boolean;
    requireAdjustmentReason: boolean;
    preventOverselling: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    currency: { type: String, default: 'INR' },
    currencySymbol: { type: String, default: '₹' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    pricingDefaults: {
      defaultPricingMethod: {
        type: String,
        enum: ['FIXED', 'COST_PLUS_MARKUP', 'TARGET_GROSS_MARGIN'],
        default: 'COST_PLUS_MARKUP',
      },
      resellerMarkupPercent: { type: Number, default: 10 },
      retailMarkupPercent: { type: Number, default: 25 },
      resellerMarginPercent: { type: Number, default: 10 },
      retailMarginPercent: { type: Number, default: 20 },
    },
    settings: {
      lowStockAlertsEnabled: { type: Boolean, default: true },
      requireAdjustmentReason: { type: Boolean, default: true },
      preventOverselling: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Store = model<IStore>('Store', StoreSchema);
