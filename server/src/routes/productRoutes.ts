import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleArchiveProduct,
  getProductPriceHistory,
  createProductSchema,
} from '../controllers/productController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getProducts);
router.post('/', requireRole('OWNER'), validateBody(createProductSchema), createProduct);
router.get('/:id', getProductById);
router.patch('/:id', requireRole('OWNER'), updateProduct);
router.post('/:id/archive', requireRole('OWNER'), toggleArchiveProduct);
router.get('/:id/price-history', getProductPriceHistory);

export default router;
