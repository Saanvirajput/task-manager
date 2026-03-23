import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getTeamLogs } from '../controllers/audit.controller';

const router = Router();

// Routes for audit logs. Prefix: /api/audit
router.get('/:teamId', authMiddleware, getTeamLogs);

export default router;
