import { Op } from "sequelize";
import { CartItemModel, ProductModel } from "../models/index.js";
import { sequelize } from "../config/database.js";

const normalizeId = (id) => {
  const value = Number(id);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

const productInclude = {
  model: ProductModel,
  as: "product",
  required: true,
  attributes: ["id", "name", "brand", "price", "stock", "imageUrl", "status"],
};

const mapCartItem = (row) => {
  const item = row.get({ plain: true });
  const product = item.product;
  return {
    id: item.id,
    userId: item.userId,
    productId: item.productId,
    quantity: Number(item.quantity),
    name: product.name,
    brand: product.brand,
    price: Number(product.price),
    formattedPrice: new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(Number(product.price)),
    stock: Number(product.stock),
    imageUrl: product.imageUrl,
    status: product.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export const cartRepository = {
  async findProductsByIds(productIds) {
    if (productIds.length === 0) return [];
    return ProductModel.findAll({
      where: { id: { [Op.in]: productIds } },
      attributes: ["id"],
    });
  },

  async findByUserId(userId) {
    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId) return [];

    const rows = await CartItemModel.findAll({
      where: { userId: normalizedUserId },
      include: [productInclude],
      order: [["createdAt", "ASC"]],
    });
    return rows.map(mapCartItem);
  },

  async replaceForUser(userId, items) {
    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId) return [];

    const transaction = await sequelize.transaction();
    try {
      await CartItemModel.destroy({
        where: { userId: normalizedUserId },
        transaction,
      });

      if (items.length > 0) {
        await CartItemModel.bulkCreate(
          items.map(({ productId, quantity }) => ({
            userId: normalizedUserId,
            productId,
            quantity,
          })),
          { transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return this.findByUserId(normalizedUserId);
  },
};
