import express from 'express';
import { clockIn, clockOut, getStatus, getMyHistory, getAllAttendance, selfieClockIn } from '../Controllers/attendanceController.js';
import { authMiddleware as protect, managerMiddleware } from '../Middleware/authMiddleware.js';
import upload from '../Middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/clock-in', protect, clockIn);
router.post('/clock-out', protect, clockOut);
router.get('/status', protect, getStatus);
router.get('/my-history', protect, getMyHistory);
router.get('/all', protect, managerMiddleware, getAllAttendance);
router.post('/selfie-clock-in', protect, upload.single('selfie'), selfieClockIn);

export default router;
