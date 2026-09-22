import express from "express";
import { orderController } from "../controller/orderController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Khách hàng đặt mua
router.post("/", authenticate, orderController.createOrder);

// Khách hàng chỉ xem các đơn của chính mình.
router.get("/my", authenticate, orderController.getMyOrders);
router.patch("/:id/cancel", authenticate, orderController.cancelOrder);
router.get("/:id", authenticate, orderController.getOrderById);

// Admin / Saler xem và duyệt đơn hàng
router.get("/", authenticate, authorize("ADMIN", "MANAGER", "SALER", "SHIPPER"), orderController.getOrders);
router.patch("/:id/status", authenticate, authorize("ADMIN", "MANAGER", "SALER", "SHIPPER"), orderController.updateOrderStatus);
router.patch("/:id/payment-status", authenticate, authorize("ADMIN", "MANAGER"), orderController.updatePaymentStatus);

export default router;
