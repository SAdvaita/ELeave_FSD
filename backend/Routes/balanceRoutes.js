import express from 'express';
import { getMyBalance, getAllBalances, adjustBalance } from '../Controllers/balanceController.js';
import { authMiddleware, managerMiddleware } from '../Middleware/authMiddleware.js';

const balanceRouter = express.Router();

balanceRouter.get("/my-balance", authMiddleware, getMyBalance);
balanceRouter.get("/all", authMiddleware, managerMiddleware, getAllBalances);
balanceRouter.post("/adjust", authMiddleware, managerMiddleware, adjustBalance);

export default balanceRouter;
