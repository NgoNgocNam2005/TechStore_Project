import { ProductModel, WishlistModel } from "../models/index.js";

const normalizeId = (id) => {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
};

const mapRow = (row) => {
  if (!row) return null;
  const data = row.get({ plain: true });
  return {
    id: data.id,
    userId: data.userId,
    productId: data.productId,
    addedAt: data.createdAt,
    product: data.product ? {
      id: data.product.id,
      name: data.product.name,
      brand: data.product.brand,
      price: Number(data.product.price),
      stock: Number(data.product.stock),
      imageUrl: data.product.imageUrl,
      status: data.product.status
    } : null
  };
};

const includeProduct = { model: ProductModel, as: "product", required: true };

export const wishlistRepository = {
  async findByUserId(userId) {
    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId) return [];

    const rows = await WishlistModel.findAll({
      where: { userId: normalizedUserId },
      include: [includeProduct],
      order: [["createdAt", "DESC"]]
    });

    return rows.map(mapRow);
  },

  async findByUserAndProduct(userId, productId) {
    const normalizedUserId = normalizeId(userId);
    const normalizedProductId = normalizeId(productId);
    if (!normalizedUserId || !normalizedProductId) return null;

    const row = await WishlistModel.findOne({
      where: { userId: normalizedUserId, productId: normalizedProductId },
      include: [includeProduct]
    });
    return mapRow(row);
  },

  async add(userId, productId) {
    const normalizedUserId = normalizeId(userId);
    const normalizedProductId = normalizeId(productId);

    if (!normalizedUserId || !normalizedProductId) return null;

    await WishlistModel.findOrCreate({
      where: { userId: normalizedUserId, productId: normalizedProductId },
      defaults: { userId: normalizedUserId, productId: normalizedProductId }
    });

    return this.findByUserAndProduct(
      normalizedUserId,
      normalizedProductId
    );
  },

  async remove(userId, productId) {
    const normalizedUserId = normalizeId(userId);
    const normalizedProductId = normalizeId(productId);

    if (!normalizedUserId || !normalizedProductId) return false;

    return (await WishlistModel.destroy({
      where: { userId: normalizedUserId, productId: normalizedProductId }
    })) > 0;
  }
};
