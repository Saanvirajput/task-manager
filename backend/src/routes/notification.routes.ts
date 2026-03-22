import { Router } from 'express';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteNotifications } from '../controllers/notification.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);
router.patch('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/', deleteNotifications);

export default router;
