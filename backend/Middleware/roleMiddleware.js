import { authMiddleware } from './authMiddleware.js';

// Re-export authMiddleware as 'protect' for cleaner route imports
export const protect = authMiddleware;

// Flexible role-based access: accepts array of allowed roles
export const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        if (req.user && allowedRoles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({
                message: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role`
            });
        }
    };
};
