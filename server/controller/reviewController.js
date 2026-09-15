import { reviewService } from "../service/reviewService.js";
import {
  CreateReviewDTO,
  UpdateReviewDTO
} from "../dto/request/reviewDTO.js";

export const reviewController = {
  async getByProduct(req, res, next) {
    try {
      const data = await reviewService.getByProduct(
        req.params.productId
      );

      res.json({
        success: true,
        count: data.length,
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const dto = new CreateReviewDTO(req.body);

      const data = await reviewService.create(
        req.user.id,
        req.params.productId,
        dto
      );

      res.status(201).json({
        success: true,
        message: "Đánh giá sản phẩm thành công",
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const dto = new UpdateReviewDTO(req.body);

      const data = await reviewService.update(
        req.user.id,
        req.params.reviewId,
        dto
      );

      res.json({
        success: true,
        message: "Cập nhật đánh giá thành công",
        data
      });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      await reviewService.remove(
        req.user.id,
        req.params.reviewId
      );

      res.json({
        success: true,
        message: "Đã xóa đánh giá"
      });
    } catch (error) {
      next(error);
    }
  }
};