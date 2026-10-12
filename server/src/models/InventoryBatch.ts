import { Schema, model, Document } from 'mongoose';

export interface IInventoryBatch extends Document {
  storeId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  purchaseId?: Schema.Types.ObjectId;
  originalQuantity: number; // in base units
  remainingQuantity: number; // in base units
  unitCost: number; // landed cost per base unit
  receivedAt: Date;
  supplierId?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryBatchSchema = new Schema<IInventoryBatch>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    purchaseId: { type: Schema.Types.ObjectId, ref: 'Purchase' },
    originalQuantity: { type: Number, required: true, min: 0 },
    remainingQuantity: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
    receivedAt: { type: Date, default: Date.now, index: true },
    supplierId: { type: Schema.Types.ObjectId, ref: 'Supplier' },
  },
  { timestamps: true }
);

// FIFO query index: finding active batches with remainingQuantity > 0 ordered by receivedAt ascending
InventoryBatchSchema.index({ storeId: 1, productId: 1, remainingQuantity: 1, receivedAt: 1 });

export const InventoryBatch = model<IInventoryBatch>('InventoryBatch', InventoryBatchSchema);
