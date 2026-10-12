import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  storeId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CategorySchema.index({ storeId: 1, name: 1 }, { unique: true });

export const Category = model<ICategory>('Category', CategorySchema);
