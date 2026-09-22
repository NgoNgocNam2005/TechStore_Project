import { cartRepository } from "../repository/cartRepository.js";
import { AppError } from "../exception/AppError.js";

const normalizeId = (id) => {
  const value = Number(id);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

export const cartService = {
  async getMine(userId) {
    return cartRepository.findByUserId(userId);
  },

  async replaceMine(userId, requestedItems) {
    if (!Array.isArray(requestedItems)) {
      throw new AppError("Danh sách sản phẩm trong giỏ hàng không hợp lệ", 400);
    }
    if (requestedItems.length > 100) {
      throw new AppError("Giỏ hàng không thể có quá 100 mặt hàng", 400);
    }

    const items = [];
    const seenProductIds = new Set();
    for (const item of requestedItems) {
      const productId = normalizeId(item?.productId);
      const quantity = Number(item?.quantity);
      if (!productId || !Number.isSafeInteger(quantity) || quantity < 1) {
        throw new AppError("Mã sản phẩm hoặc số lượng trong giỏ hàng không hợp lệ", 400);
      }
      if (seenProductIds.has(productId)) {
        throw new AppError("Giỏ hàng có sản phẩm bị lặp", 400);
      }
      seenProductIds.add(productId);
      items.push({ productId, quantity });
    }

    const products = await cartRepository.findProductsByIds(
      items.map((item) => item.productId),
    );
    if (products.length !== items.length) {
      throw new AppError("Một hoặc nhiều sản phẩm trong giỏ không còn tồn tại", 404);
    }

    return cartRepository.replaceForUser(userId, items);
  },
};
