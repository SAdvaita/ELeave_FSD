import express from 'express';
import { authMiddleware } from '../Middleware/authMiddleware.js';
import { roleMiddleware } from '../Middleware/roleMiddleware.js';
import {
    scheduleMeeting,
    getMeetings,
    getMeetingById,
    deleteMeeting,
    getEmployeesList
} from '../Controllers/meetingController.js';

const router = express.Router();

router.post('/schedule', authMiddleware, roleMiddleware(['manager']), scheduleMeeting);
router.get('/', authMiddleware, getMeetings);
router.get('/employees', authMiddleware, roleMiddleware(['manager']), getEmployeesList);
router.get('/:id', authMiddleware, getMeetingById);
router.delete('/:id', authMiddleware, roleMiddleware(['manager']), deleteMeeting);

export default router;
