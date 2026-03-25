import express from 'express';
import { getMySalary, getAllSalaries } from '../Controllers/salaryController.js';
import { authMiddleware, managerMiddleware } from '../Middleware/authMiddleware.js';

const router = express.Router();

router.get('/my-salary', authMiddleware, getMySalary);
router.get('/all-salaries', authMiddleware, managerMiddleware, getAllSalaries);

export default router;
