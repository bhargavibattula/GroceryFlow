import { Schema, model, Document } from 'mongoose';

export interface IAuditLog extends Document {
  storeId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  userNameSnapshot?: string;
  action: string;
  entityType: 'Product' | 'Purchase' | 'Sale' | 'SaleReturn' | 'InventoryMovement' | 'User' | 'Store' | 'Price';
  entityId?: Schema.Types.ObjectId | string;
  relevantChanges?: any;
  ipAddress?: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userNameSnapshot: { type: String, default: '' },
    action: { type: String, required: true },
    entityType: {
      type: String,
      enum: ['Product', 'Purchase', 'Sale', 'SaleReturn', 'InventoryMovement', 'User', 'Store', 'Price'],
      required: true,
      index: true,
    },
    entityId: { type: Schema.Types.Mixed },
    relevantChanges: { type: Schema.Types.Mixed },
    ipAddress: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AuditLogSchema.index({ storeId: 1, timestamp: -1 });

export const AuditLog = model<IAuditLog>('AuditLog', AuditLogSchema);
