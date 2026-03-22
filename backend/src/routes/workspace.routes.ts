import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import * as workspaceController from '../controllers/workspace.controller';

import { requireRole } from '../middleware/rbac.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/', workspaceController.createWorkspace);
router.get('/my', workspaceController.getMyWorkspaces);
router.get('/:id', workspaceController.getWorkspaceById);
router.post('/:id/invite', requireRole(['ADMIN']), workspaceController.inviteMember);
router.delete('/:id/members/:userId', requireRole(['ADMIN']), workspaceController.removeMember);
router.put('/:id/members/:userId/role', requireRole(['ADMIN']), workspaceController.updateMemberRole);

export default router;
