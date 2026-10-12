import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User';
import { Store } from '../models/Store';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../middleware/auth';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(req: Request, res: Response): Promise<void> {
  const { identifier, password } = req.body;

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
  }).select('+passwordHash');

  if (!user || !user.active) {
    res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ success: false, message: 'Invalid credentials.' });
    return;
  }

  const store = await Store.findById(user.storeId);

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      storeId: user.storeId.toString(),
      role: user.role,
      permissions: user.permissions,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      store: store
        ? {
            id: store._id,
            name: store.name,
            currency: store.currency,
            currencySymbol: store.currencySymbol,
          }
        : null,
    },
  });
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const store = await Store.findById(req.user.storeId);

  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      username: req.user.username,
      role: req.user.role,
      permissions: req.user.permissions,
      store: store
        ? {
            id: store._id,
            name: store.name,
            currency: store.currency,
            currencySymbol: store.currencySymbol,
            pricingDefaults: store.pricingDefaults,
          }
        : null,
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.json({ success: true, message: 'Logged out successfully.' });
}
