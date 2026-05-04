import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { closeOrder, createOrder, getOrderById, getOrders } from "../controllers/trade.controller.js";

const router: Router = Router();

router.post('/open', authenticate, createOrder);
router.post("/close/:orderId", authenticate, closeOrder);
router.get("/orders", getOrders);
router.get("/orders/:orderId", getOrderById);

export default router;