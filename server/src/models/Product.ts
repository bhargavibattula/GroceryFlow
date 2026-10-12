import { Schema, model, Document } from 'mongoose';

export interface ISellingUnit {
  unitName: string;
  conversionFactor: number; // e.g. 1 carton = 12 bottles, so 1 carton is 12 base units
}

export interface IPricingConfiguration {
  method: 'FIXED' | 'COST_PLUS_MARKUP' | 'TARGET_GROSS_MARGIN';
  resellerMarkupPercent: number;
  retailMarkupPercent: number;
  resellerMarginPercent: number;
  retailMarginPercent: number;
  minSellingPrice?: number;
}

export interface IProduct extends Document {
  storeId: Schema.Types.ObjectId;
  sku: string;
  barcode?: string;
  name: string;
  brand?: string;
  categoryId?: Schema.Types.ObjectId;
  description?: string;
  imageUrl?: string;
  baseUnit: string;
  sellingUnits: ISellingUnit[];
  lowStockThreshold: number;
  availableQuantity: number; // in base units
  currentCostBasis: number; // cost per base unit
  pricingConfiguration: IPricingConfiguration;
  resellerPrice: number; // price per base unit
  retailPrice: number; // price per base unit
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SellingUnitSchema = new Schema<ISellingUnit>(
  {
    unitName: { type: String, required: true },
    conversionFactor: { type: Number, required: true, min: 0.0001 },
  },
  { _id: false }
);

const PricingConfigSchema = new Schema<IPricingConfiguration>(
  {
    method: {
      type: String,
      enum: ['FIXED', 'COST_PLUS_MARKUP', 'TARGET_GROSS_MARGIN'],
      default: 'COST_PLUS_MARKUP',
    },
    resellerMarkupPercent: { type: Number, default: 10 },
    retailMarkupPercent: { type: Number, default: 25 },
    resellerMarginPercent: { type: Number, default: 10 },
    retailMarginPercent: { type: Number, default: 20 },
    minSellingPrice: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    sku: { type: String, required: true, trim: true },
    barcode: { type: String, trim: true, default: '' },
    name: { type: String, required: true, trim: true },
    brand: { type: String, trim: true, default: '' },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', index: true },
    description: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    baseUnit: { type: String, required: true, default: 'kg' },
    sellingUnits: { type: [SellingUnitSchema], default: [] },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    availableQuantity: { type: Number, default: 0 },
    currentCostBasis: { type: Number, default: 0, min: 0 },
    pricingConfiguration: { type: PricingConfigSchema, default: () => ({}) },
    resellerPrice: { type: Number, required: true, min: 0 },
    retailPrice: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Compound unique index for storeId + sku
ProductSchema.index({ storeId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ storeId: 1, name: 'text', brand: 'text', barcode: 1 });

export const Product = model<IProduct>('Product', ProductSchema);
