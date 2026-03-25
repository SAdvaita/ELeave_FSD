import User from "../Models/userModel.js";
import jwt from "jsonwebtoken";

// Verify JWT token and authenticate user
export const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token || '';

    if (!token) {
        return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized: User not found" });
        }

        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
};

// Ensure user is an employee
export const employeeMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'employee') {
        next();
    } else {
        return res.status(403).json({ message: "Forbidden: Employees only" });
    }
};

// Ensure user is a manager
export const managerMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'manager') {
        next();
    } else {
        return res.status(403).json({ message: "Forbidden: Managers only" });
    }
};
