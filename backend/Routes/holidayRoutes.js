import express from 'express';
import { protect } from '../Middleware/roleMiddleware.js';
import { roleMiddleware } from '../Middleware/roleMiddleware.js';
import { getHolidays, addHoliday, deleteHoliday, seedDefaultHolidays } from '../Controllers/holidayController.js';

const router = express.Router();

router.get('/', protect, getHolidays);
router.post('/', protect, roleMiddleware(['manager', 'hr']), addHoliday);
router.post('/seed', protect, roleMiddleware(['manager', 'hr']), seedDefaultHolidays);
router.delete('/:id', protect, roleMiddleware(['manager', 'hr']), deleteHoliday);

export default router;
