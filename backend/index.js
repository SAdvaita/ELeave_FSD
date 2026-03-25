import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './Database/connection.js';
import authRouter from './Routes/authRoutes.js';
import leaveRouter from './Routes/leaveRoutes.js';
import balanceRouter from './Routes/balanceRoutes.js';
import attendanceRouter from './Routes/attendanceRoutes.js';
import profileRouter from './Routes/profileRoutes.js';
import holidayRouter from './Routes/holidayRoutes.js';
import notificationRouter from './Routes/notificationRoutes.js';
import reportRouter from './Routes/reportRoutes.js';
import salaryRouter from './Routes/salaryRoutes.js';
import wfhRouter from './Routes/wfhRoutes.js';
import meetingRouter from './Routes/meetingRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: [
    "https://e-leave-fsd.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true
}));
// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get("/", (req, res) => {
    res.status(200).json({
        message: "ETime Leave Management System API",
        version: "2.0.0",
        status: "running"
    });
});

app.use("/api/auth", authRouter);
app.use("/api/leaves", leaveRouter);
app.use("/api/balance", balanceRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/profile", profileRouter);
app.use("/api/holidays", holidayRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/reports", reportRouter);
app.use("/api/salary", salaryRouter);
app.use("/api/wfh", wfhRouter);
app.use("/api/meetings", meetingRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    connectDB();
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏢 ETime Leave Management System v2.0`);
});
