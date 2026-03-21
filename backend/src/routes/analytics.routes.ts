import { Router } from 'express';
import { getAnalyticsOverview } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/overview', getAnalyticsOverview);

export default router;
