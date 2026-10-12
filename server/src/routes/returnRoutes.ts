import { Router } from 'express';
import { createReturn, getReturns, processReturnSchema } from '../controllers/returnController';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', getReturns);
router.post('/sales/:id/returns', validateBody(processReturnSchema), createReturn);

export default router;
