import { Schema, model, Document } from 'mongoose';

export interface IReminder extends Document {
  storeId: Schema.Types.ObjectId;
  accountId: Schema.Types.ObjectId;
  relatedInvoice?: string;
  amountDue: number;
  dueDate: Date;
  messageText: string;
  channel: 'WHATSAPP' | 'SMS';
  status: 'PENDING' | 'SENT' | 'CANCELLED';
  sentAt?: Date;
  providerReference?: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<IReminder>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    relatedInvoice: { type: String, default: '' },
    amountDue: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true, index: true },
    messageText: { type: String, required: true },
    channel: { type: String, enum: ['WHATSAPP', 'SMS'], default: 'WHATSAPP' },
    status: { type: String, enum: ['PENDING', 'SENT', 'CANCELLED'], default: 'PENDING', index: true },
    sentAt: { type: Date },
    providerReference: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ReminderSchema.index({ storeId: 1, dueDate: 1 });

export const Reminder = model<IReminder>('Reminder', ReminderSchema);
