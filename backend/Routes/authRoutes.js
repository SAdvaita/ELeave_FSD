import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getProfile,
    forgotPassword,
    verifyOtp,
    resetPassword
} from '../Controllers/authController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';

const authRouter = express.Router();

// Public routes
authRouter.post("/register", registerUser);
authRouter.post("/login", loginUser);
authRouter.post("/forgot-password", forgotPassword);
authRouter.post("/verify-otp", verifyOtp);
authRouter.post("/reset-password", resetPassword);

// Protected routes
authRouter.get("/logout", authMiddleware, logoutUser);
authRouter.get("/profile", authMiddleware, getProfile);

export default authRouter;

