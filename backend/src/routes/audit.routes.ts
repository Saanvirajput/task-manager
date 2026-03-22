import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { getAuditLogs } from '../controllers/audit.controller';

const router = Router();

// Routes for audit logs. Prefix: /api/workspaces
router.get('/:id/audit-logs', authMiddleware, getAuditLogs);

export default router;
