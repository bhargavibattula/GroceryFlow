import { Schema, model, Document } from 'mongoose';

export type MovementType =
  | 'PURCHASE_RECEIPT'
  | 'SALE'
  | 'CUSTOMER_RETURN'
  | 'SUPPLIER_RETURN'
  | 'DAMAGE_SPOILAGE'
  | 'MANUAL_ADJUSTMENT'
  | 'CORRECTION_REVERSAL';

export interface IInventoryMovement extends Document {
  storeId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  quantityDelta: number; // in base units (+ for increase, - for decrease)
  movementType: MovementType;
  referenceType: 'Purchase' | 'Sale' | 'SaleReturn' | 'ManualAdjustment' | 'Damage';
  referenceId?: Schema.Types.ObjectId;
  reason?: string;
  unitCostBasis?: number;
  resultingQuantity?: number;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
}

const InventoryMovementSchema = new Schema<IInventoryMovement>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    quantityDelta: { type: Number, required: true },
    movementType: {
      type: String,
      enum: [
        'PURCHASE_RECEIPT',
        'SALE',
        'CUSTOMER_RETURN',
        'SUPPLIER_RETURN',
        'DAMAGE_SPOILAGE',
        'MANUAL_ADJUSTMENT',
        'CORRECTION_REVERSAL',
      ],
      required: true,
      index: true,
    },
    referenceType: {
      type: String,
      enum: ['Purchase', 'Sale', 'SaleReturn', 'ManualAdjustment', 'Damage'],
      required: true,
    },
    referenceId: { type: Schema.Types.ObjectId },
    reason: { type: String, default: '' },
    unitCostBasis: { type: Number, default: 0 },
    resultingQuantity: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

InventoryMovementSchema.index({ storeId: 1, productId: 1, createdAt: -1 });

export const InventoryMovement = model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema);
