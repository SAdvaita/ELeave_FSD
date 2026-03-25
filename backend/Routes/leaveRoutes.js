import express from 'express';
import { protect } from '../Middleware/roleMiddleware.js';
import { roleMiddleware } from '../Middleware/roleMiddleware.js';
import {
    applyLeave, getMyLeaves, getAllLeaves,
    approveLeave, rejectLeave, cancelLeave, getMyLeaveSummary
} from '../Controllers/leaveController.js';

const router = express.Router();

router.post('/apply', protect, applyLeave);
router.get('/my-leaves', protect, getMyLeaves);
router.get('/my-summary', protect, getMyLeaveSummary);
router.put('/:id/cancel', protect, cancelLeave);

// Manager/HR routes
router.get('/all', protect, roleMiddleware(['manager', 'hr']), getAllLeaves);
router.put('/:id/approve', protect, roleMiddleware(['manager', 'hr']), approveLeave);
router.put('/:id/reject', protect, roleMiddleware(['manager', 'hr']), rejectLeave);

export default router;
