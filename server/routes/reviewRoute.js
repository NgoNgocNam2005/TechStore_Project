import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { reviewController } from "../controller/reviewController.js";

const router = express.Router();

router.get(
  "/products/:productId/reviews",
  reviewController.getByProduct
);

router.post(
  "/products/:productId/reviews",
  authenticate,
  reviewController.create
);

router.patch(
  "/reviews/:reviewId",
  authenticate,
  reviewController.update
);

router.delete(
  "/reviews/:reviewId",
  authenticate,
  reviewController.remove
);
export default router;