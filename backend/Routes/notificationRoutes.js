import express from 'express';
import { protect } from '../Middleware/roleMiddleware.js';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../Controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getNotifications);
router.put('/mark-all-read', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

export default router;
