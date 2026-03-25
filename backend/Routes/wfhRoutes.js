import express from 'express';
import { authMiddleware } from '../Middleware/authMiddleware.js';
import { roleMiddleware } from '../Middleware/roleMiddleware.js';
import {
    applyWfh,
    getMyWfhRequests,
    getAllWfhRequests,
    approveWfh,
    rejectWfh,
    checkWfhToday
} from '../Controllers/wfhController.js';

const router = express.Router();

// Employee routes
router.post('/apply', authMiddleware, applyWfh);
router.get('/my-requests', authMiddleware, getMyWfhRequests);
router.get('/check-today', authMiddleware, checkWfhToday);

// Manager routes
router.get('/all', authMiddleware, roleMiddleware(['manager']), getAllWfhRequests);
router.put('/:id/approve', authMiddleware, roleMiddleware(['manager']), approveWfh);
router.put('/:id/reject', authMiddleware, roleMiddleware(['manager']), rejectWfh);

export default router;
