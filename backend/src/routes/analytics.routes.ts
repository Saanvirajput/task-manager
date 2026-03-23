import { Router } from 'express';
import { getWorkloadAnalytics } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/workload/:teamId', authMiddleware, getWorkloadAnalytics);

export default router;
