import {
  OrderDetailModel,
  OrderModel,
  ProductReviewModel,
  UserModel,
} from "../models/index.js";
import { ProductReview } from "../entity/ProductReview.js";

const normalizeId = (id) => {
  const value = Number(id);

  return Number.isInteger(value) && value > 0
    ? value
    : null;
};

const toEntity = (row) => {
  if (!row) return null;
  const data = row.get({ plain: true });
  return new ProductReview({
    id: data.id,
    userId: data.userId,
    productId: data.productId,
    rating: Number(data.rating),
    comment: data.comment,
    authorName: data.user?.fullName || null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  });
};

const includeAuthor = { model: UserModel, as: "user", attributes: ["id", "fullName"] };

export const reviewRepository = {
  async findByProductId(productId) {
    const normalizedProductId = normalizeId(productId);

    if (!normalizedProductId) return [];

    const rows = await ProductReviewModel.findAll({
      where: { productId: normalizedProductId },
      include: [includeAuthor],
      order: [["createdAt", "DESC"]]
    });
    return rows.map(toEntity);
  },

  async findById(id) {
    const normalizedIdValue = normalizeId(id);

    if (!normalizedIdValue) return null;

    return toEntity(await ProductReviewModel.findByPk(normalizedIdValue, {
      include: [includeAuthor]
    }));
  },

  async findByUserAndProduct(userId, productId) {
    const normalizedUserId = normalizeId(userId);
    const normalizedProductId = normalizeId(productId);

    if (!normalizedUserId || !normalizedProductId) {
      return null;
    }

    return toEntity(await ProductReviewModel.findOne({
      where: { userId: normalizedUserId, productId: normalizedProductId },
      include: [includeAuthor]
    }));
  },

  async hasDeliveredProduct(userId, productId) {
    const normalizedUserId = normalizeId(userId);
    const normalizedProductId = normalizeId(productId);
    if (!normalizedUserId || !normalizedProductId) return false;

    const order = await OrderModel.findOne({
      attributes: ["id"],
      where: { userId: normalizedUserId, status: "DELIVERED" },
      include: [{
        model: OrderDetailModel,
        as: "details",
        attributes: ["id"],
        where: { productId: normalizedProductId },
        required: true
      }]
    });
    return Boolean(order);
  },

  async create(userId, productId, fields) {
    const row = await ProductReviewModel.create({
      userId,
      productId,
      rating: fields.rating,
      comment: fields.comment || null
    });
    return this.findById(row.id);
  },

  async updateOwned(id, userId, fields) {
    const values = {};
    if (fields.rating !== undefined) values.rating = fields.rating;
    if (fields.comment !== undefined) values.comment = fields.comment || null;
    if (Object.keys(values).length > 0) {
      await ProductReviewModel.update(values, { where: { id, userId } });
    }

    return this.findById(id);
  },

  async deleteOwned(id, userId) {
    return (await ProductReviewModel.destroy({ where: { id, userId } })) > 0;
  }
};
