import { Router } from 'express';
import { getPurchases, getPurchaseById, recordPurchase, createPurchaseSchema } from '../controllers/purchaseController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// Bulk purchases can be viewed and recorded by OWNER
router.get('/', requireRole('OWNER'), getPurchases);
router.get('/:id', requireRole('OWNER'), getPurchaseById);
router.post('/', requireRole('OWNER'), validateBody(createPurchaseSchema), recordPurchase);

export default router;
