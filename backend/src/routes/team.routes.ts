import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as teamController from '../controllers/team.controller';
import { checkRole } from '../middleware/rbac.middleware';
import { Role } from '@prisma/client';

const router = Router();

router.use(authMiddleware);

router.post('/', teamController.createTeam);
router.get('/my', teamController.getMyTeams);
router.get('/:id', teamController.getTeamById);

// Admin-only management
router.post('/:id/invite', checkRole([Role.ADMIN]), teamController.inviteMember);
router.delete('/:id/members/:userId', checkRole([Role.ADMIN]), teamController.removeMember);
router.put('/:id/members/:userId/role', checkRole([Role.ADMIN]), teamController.updateMemberRole);

export default router;
