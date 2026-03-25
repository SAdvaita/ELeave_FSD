import express from 'express';
import { uploadProfilePicture } from '../Controllers/profileController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';
import upload from '../Middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('image'), uploadProfilePicture);

export default router;
