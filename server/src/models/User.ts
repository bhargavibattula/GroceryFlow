import { Schema, model, Document } from 'mongoose';

export type UserRole = 'OWNER' | 'SALESPERSON';

export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  storeId: Schema.Types.ObjectId;
  permissions: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['OWNER', 'SALESPERSON'], default: 'SALESPERSON' },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    permissions: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
