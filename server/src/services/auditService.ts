import { AuditLog } from '../models/AuditLog';

export async function logAudit({
  storeId,
  userId,
  userNameSnapshot,
  action,
  entityType,
  entityId,
  relevantChanges,
  ipAddress,
}: {
  storeId: any;
  userId: any;
  userNameSnapshot?: string;
  action: string;
  entityType: 'Product' | 'Purchase' | 'Sale' | 'SaleReturn' | 'InventoryMovement' | 'User' | 'Store' | 'Price';
  entityId?: any;
  relevantChanges?: any;
  ipAddress?: string;
}) {
  try {
    await AuditLog.create({
      storeId,
      userId,
      userNameSnapshot,
      action,
      entityType,
      entityId,
      relevantChanges,
      ipAddress,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record audit log:', err);
  }
}
