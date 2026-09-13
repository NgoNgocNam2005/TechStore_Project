import express from "express";
import { authController } from "../controller/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authRateLimit } from "../middleware/security.js";

const router = express.Router();

router.post("/register", authRateLimit, authController.register);
router.post("/login", authRateLimit, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
