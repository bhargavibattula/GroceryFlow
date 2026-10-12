import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUserPermissions,
  getAuditLogs,
  getStoreSettings,
  updateStoreSettings,
  createUserSchema,
} from '../controllers/userController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/users', requireRole('OWNER'), getUsers);
router.post('/users', requireRole('OWNER'), validateBody(createUserSchema), createUser);
router.patch('/users/:id/permissions', requireRole('OWNER'), updateUserPermissions);
router.get('/audit-logs', requireRole('OWNER'), getAuditLogs);
router.get('/store/settings', getStoreSettings);
router.patch('/store/settings', requireRole('OWNER'), updateStoreSettings);

export default router;
