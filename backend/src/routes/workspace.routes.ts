import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as workspaceController from '../controllers/workspace.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', workspaceController.createWorkspace);
router.get('/my', workspaceController.getMyWorkspaces);
router.get('/:id', workspaceController.getWorkspaceById);
router.post('/:id/invite', workspaceController.inviteMember);
router.delete('/:id/members/:userId', workspaceController.removeMember);
router.put('/:id/members/:userId/role', workspaceController.updateMemberRole);

export default router;
