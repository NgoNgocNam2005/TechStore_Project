import express from "express";
import { userController } from "../controller/userController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";
import { wishlistController } from "../controller/wishlistController.js";

const router = express.Router();

router.get("/me", authenticate, userController.getProfile);
router.patch("/me", authenticate, userController.updateProfile);
router.patch("/me/password", authenticate, userController.changePassword);
router.get("/me/addresses", authenticate, userController.getAddresses);
router.post("/me/addresses", authenticate, userController.createAddress);
router.patch("/me/addresses/:addressId", authenticate, userController.updateAddress);
router.delete("/me/addresses/:addressId", authenticate, userController.deleteAddress);
router.get("/me/wishlist", authenticate, wishlistController.getMine);
router.post("/me/wishlist", authenticate, wishlistController.add);
router.delete("/me/wishlist/:productId", authenticate, wishlistController.remove);
// Quyền Admin: Quản lý nhân viên
router.get("/employees", authenticate, authorize("ADMIN"), userController.getEmployees);
router.post("/employees", authenticate, authorize("ADMIN"), userController.createEmployee);
router.put("/employees/:id", authenticate, authorize("ADMIN"), userController.updateEmployee);
router.delete("/employees/:id", authenticate, authorize("ADMIN"), userController.deleteEmployee);

export default router;
