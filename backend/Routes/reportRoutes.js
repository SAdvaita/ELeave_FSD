import express from 'express';
import { protect } from '../Middleware/roleMiddleware.js';
import { roleMiddleware } from '../Middleware/roleMiddleware.js';
import { getOverviewStats, getEmployeeLeaveReport, getBalanceReport } from '../Controllers/reportController.js';

const router = express.Router();

router.get('/overview', protect, roleMiddleware(['manager', 'hr']), getOverviewStats);
router.get('/leaves', protect, roleMiddleware(['manager', 'hr']), getEmployeeLeaveReport);
router.get('/balances', protect, roleMiddleware(['manager', 'hr']), getBalanceReport);

export default router;
