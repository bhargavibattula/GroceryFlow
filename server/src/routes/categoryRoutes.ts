import { Router } from 'express';
import { getCategories, createCategory, createCategorySchema } from '../controllers/categoryController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getCategories);
router.post('/', requireRole('OWNER'), validateBody(createCategorySchema), createCategory);

export default router;
