import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { Store } from '../models/Store';
import { AuditLog } from '../models/AuditLog';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../services/auditService';

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['OWNER', 'SALESPERSON']).default('SALESPERSON'),
  permissions: z.array(z.string()).optional(),
});

export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const users = await User.find({ storeId }).select('-passwordHash').sort({ createdAt: 1 });
  res.json({ success: true, data: users });
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { name, email, username, password, role, permissions = [] } = req.body;

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
  });
  if (existing) {
    res.status(400).json({ success: false, message: 'Email or username already in use.' });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    storeId,
    name: name.trim(),
    email: email.toLowerCase().trim(),
    username: username.toLowerCase().trim(),
    passwordHash,
    role,
    permissions,
    active: true,
  });

  await logAudit({
    storeId,
    userId: req.auth!.userId,
    userNameSnapshot: req.user?.name,
    action: 'CREATE_USER',
    entityType: 'User',
    entityId: newUser._id,
    relevantChanges: { name: newUser.name, role: newUser.role },
  });

  res.status(201).json({
    success: true,
    data: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      username: newUser.username,
      role: newUser.role,
      permissions: newUser.permissions,
    },
  });
}

export async function updateUserPermissions(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { permissions, role, active } = req.body;

  const user = await User.findOne({ _id: req.params.id, storeId });
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  if (permissions !== undefined) user.permissions = permissions;
  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;

  await user.save();

  await logAudit({
    storeId,
    userId: req.auth!.userId,
    userNameSnapshot: req.user?.name,
    action: 'UPDATE_PERMISSIONS',
    entityType: 'User',
    entityId: user._id,
    relevantChanges: { permissions, role, active },
  });

  res.json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      role: user.role,
      permissions: user.permissions,
      active: user.active,
    },
  });
}

export async function getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const { entityType, page = '1', limit = '50' } = req.query;

  const query: any = { storeId };
  if (entityType) query.entityType = entityType;

  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum),
    AuditLog.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: logs,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

export async function getStoreSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const store = await Store.findById(storeId);
  if (!store) {
    res.status(404).json({ success: false, message: 'Store not found.' });
    return;
  }
  res.json({ success: true, data: store });
}

export async function updateStoreSettings(req: AuthenticatedRequest, res: Response): Promise<void> {
  const storeId = req.auth!.storeId;
  const store = await Store.findById(storeId);
  if (!store) {
    res.status(404).json({ success: false, message: 'Store not found.' });
    return;
  }

  const { name, address, phone, currency, currencySymbol, pricingDefaults, settings } = req.body;
  if (name) store.name = name;
  if (address !== undefined) store.address = address;
  if (phone !== undefined) store.phone = phone;
  if (currency) store.currency = currency;
  if (currencySymbol) store.currencySymbol = currencySymbol;
  if (pricingDefaults) store.pricingDefaults = { ...store.pricingDefaults, ...pricingDefaults };
  if (settings) store.settings = { ...store.settings, ...settings };

  await store.save();

  res.json({ success: true, data: store, message: 'Store settings updated.' });
}
