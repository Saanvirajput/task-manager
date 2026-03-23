import { Router } from 'express';
import { getTeamIntegrations, createIntegration, deleteIntegration } from '../controllers/integration.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/:teamId', getTeamIntegrations);
router.post('/:teamId', createIntegration);
router.delete('/:id', deleteIntegration);

export default router;
