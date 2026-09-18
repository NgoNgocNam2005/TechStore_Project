import express from "express";
import { invoiceController } from "../controller/invoiceController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Khai báo /my trước /:invoiceId để không bị hiểu nhầm là mã hóa đơn.
router.get("/my", authenticate, invoiceController.getMine);
router.get("/:invoiceId", authenticate, invoiceController.getById);

export default router;
