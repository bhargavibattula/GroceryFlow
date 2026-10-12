import { Router } from 'express';
import {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  createSupplierSchema,
} from '../controllers/supplierController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getSuppliers);
router.get('/:id', getSupplierById);
router.post('/', requireRole('OWNER'), validateBody(createSupplierSchema), createSupplier);
router.patch('/:id', requireRole('OWNER'), updateSupplier);

export default router;
