import { Router } from 'express';
import { getSales, getSaleById, processSale, cancelSale, createSaleSchema } from '../controllers/saleController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getSales);
router.post('/', validateBody(createSaleSchema), processSale);
router.get('/:id', getSaleById);
router.post('/:id/cancel', requireRole('OWNER'), cancelSale);

export default router;
