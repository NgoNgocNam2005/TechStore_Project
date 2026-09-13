import express from "express";
import { productController } from "../controller/productController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Khách hàng & Admin đều xem được danh sách và chi tiết
router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);

// Quyền Admin: Thêm, sửa giá/kho, xóa
router.post("/", authenticate, authorize("ADMIN", "MANAGER"), productController.createProduct);
router.put("/:id", authenticate, authorize("ADMIN", "MANAGER"), productController.updateProduct);
router.delete("/:id", authenticate, authorize("ADMIN"), productController.deleteProduct);

export default router;
