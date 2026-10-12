import { Schema, model, Document } from 'mongoose';

export interface ISupplier extends Document {
  storeId: Schema.Types.ObjectId;
  name: string;
  phone: string;
  address: string;
  notes?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    notes: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

SupplierSchema.index({ storeId: 1, name: 1 });

export const Supplier = model<ISupplier>('Supplier', SupplierSchema);
