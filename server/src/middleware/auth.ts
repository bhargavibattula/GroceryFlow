import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User, IUser, UserRole } from '../models/User';

export interface AuthUserPayload {
  userId: string;
  storeId: string;
  role: UserRole;
  permissions: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  auth?: AuthUserPayload;
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Missing or malformed Bearer token.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as AuthUserPayload;

    const user = await User.findById(decoded.userId);
    if (!user || !user.active) {
      res.status(401).json({
        success: false,
        message: 'User account not found or inactive.',
      });
      return;
    }

    req.user = user;
    req.auth = {
      userId: user._id.toString(),
      storeId: user.storeId.toString(),
      role: user.role,
      permissions: user.permissions || [],
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token.',
      error: error.message,
    });
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. This operation requires one of the following roles: ${roles.join(', ')}.`,
      });
      return;
    }
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    // Owner has super-admin rights to all permissions
    if (req.user.role === 'OWNER') {
      next();
      return;
    }

    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Missing required permission: ${permission}.`,
      });
      return;
    }

    next();
  };
}
