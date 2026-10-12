import { Router } from 'express';
import { previewPricing, updatePricing, previewPricingSchema, updatePricingSchema } from '../controllers/pricingController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

// Preview and updates are restricted to OWNER or managers with pricing permission
router.post('/:id/pricing/preview', requireRole('OWNER'), validateBody(previewPricingSchema), previewPricing);
router.patch('/:id/pricing', requireRole('OWNER'), validateBody(updatePricingSchema), updatePricing);

export default router;
