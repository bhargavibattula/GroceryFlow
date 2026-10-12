import { Response } from 'express';
import { z } from 'zod';
import { Supplier } from '../models/Supplier';
import { Purchase } from '../models/Purchase';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export async function getSuppliers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const suppliers = await Supplier.find({ storeId, active: true }).sort({ name: 1 });
  res.json({ success: true, data: suppliers });
}

export async function getSupplierById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const supplier = await Supplier.findOne({ _id: req.params.id, storeId });

  if (!supplier) {
    res.status(404).json({ success: false, message: 'Supplier not found.' });
    return;
  }

  // Get recent purchases from this supplier
  const purchases = await Purchase.find({ storeId, supplierId: supplier._id })
    .sort({ purchasedAt: -1 })
    .limit(20);

  res.json({ success: true, data: { supplier, purchases } });
}

export async function createSupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const supplier = await Supplier.create({
    storeId,
    name: req.body.name.trim(),
    phone: req.body.phone?.trim() || '',
    address: req.body.address?.trim() || '',
    notes: req.body.notes?.trim() || '',
    active: true,
  });

  await logAudit({
    storeId,
    userId: req.auth!.userId,
    userNameSnapshot: req.user?.name,
    action: 'CREATE_SUPPLIER',
    entityType: 'Store',
    entityId: supplier._id,
    relevantChanges: { name: supplier.name },
  });

  res.status(201).json({ success: true, data: supplier });
}

export async function updateSupplier(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const supplier = await Supplier.findOne({ _id: req.params.id, storeId });

  if (!supplier) {
    res.status(404).json({ success: false, message: 'Supplier not found.' });
    return;
  }

  const fields = ['name', 'phone', 'address', 'notes', 'active'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) {
      (supplier as any)[f] = req.body[f];
    }
  });

  await supplier.save();
  res.json({ success: true, data: supplier });
}
