import { Router } from 'express';
import {
  getInventorySummary,
  getInventoryMovements,
  getLowStockProducts,
  adjustStock,
  stockAdjustmentSchema,
} from '../controllers/inventoryController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/summary', getInventorySummary);
router.get('/movements', getInventoryMovements);
router.get('/low-stock', getLowStockProducts);
router.post('/adjustments', requireRole('OWNER'), validateBody(stockAdjustmentSchema), adjustStock);

export default router;
