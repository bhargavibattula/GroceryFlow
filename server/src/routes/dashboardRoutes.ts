import { Router } from 'express';
import {
  getDashboard,
  getSalesReport,
  getProfitReport,
  getInventoryReport,
} from '../controllers/dashboardController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/summary', getDashboard);
router.get('/reports/sales', getSalesReport);
router.get('/reports/profit', requireRole('OWNER'), getProfitReport);
router.get('/reports/inventory', requireRole('OWNER'), getInventoryReport);

export default router;
