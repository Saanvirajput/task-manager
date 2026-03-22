import { Router } from 'express';
import { getIntegrations, createIntegration, deleteIntegration } from '../controllers/integration.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/:workspaceId', getIntegrations);
router.post('/:workspaceId', createIntegration);
router.delete('/:id', deleteIntegration);

export default router;
