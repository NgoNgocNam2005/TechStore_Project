import { reviewRepository } from "../repository/reviewRepository.js";
import { productRepository } from "../repository/productRepository.js";
import { reviewMapper } from "../mapper/reviewMapper.js";
import { AppError } from "../exception/AppError.js";

export const reviewService = {
  async getByProduct(productId) {
    const product =
      await productRepository.findById(productId);

    if (!product) {
      throw new AppError(
        "Sản phẩm không tồn tại",
        404
      );
    }

    const reviews =
      await reviewRepository.findByProductId(productId);

    return reviewMapper.toListResponseDTO(reviews);
  },

  async create(userId, productId, dto) {
    dto.validate();

    const product =
      await productRepository.findById(productId);

    if (!product) {
      throw new AppError(
        "Sản phẩm không tồn tại",
        404
      );
    }

    const hasPurchased =
      await reviewRepository.hasDeliveredProduct(
        userId,
        productId
      );

    if (!hasPurchased) {
      throw new AppError(
        "Bạn chỉ có thể đánh giá sản phẩm đã mua và nhận hàng",
        403
      );
    }

    const existing =
      await reviewRepository.findByUserAndProduct(
        userId,
        productId
      );

    if (existing) {
      throw new AppError(
        "Bạn đã đánh giá sản phẩm này",
        409
      );
    }

    const review = await reviewRepository.create(
      userId,
      productId,
      dto
    );

    return reviewMapper.toResponseDTO(review);
  },

  async update(userId, reviewId, dto) {
    dto.validate();

    const existing =
      await reviewRepository.findById(reviewId);

    if (!existing) {
      throw new AppError(
        "Đánh giá không tồn tại",
        404
      );
    }

    if (Number(existing.userId) !== Number(userId)) {
      throw new AppError(
        "Bạn không có quyền sửa đánh giá này",
        403
      );
    }

    const updated =
      await reviewRepository.updateOwned(
        reviewId,
        userId,
        dto
      );

    return reviewMapper.toResponseDTO(updated);
  },

  async remove(userId, reviewId) {
    const removed =
      await reviewRepository.deleteOwned(
        reviewId,
        userId
      );

    if (!removed) {
      throw new AppError(
        "Đánh giá không tồn tại hoặc bạn không có quyền xóa",
        404
      );
    }
  }
};