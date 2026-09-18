import { OrderDetailModel, ProductModel } from "../models/index.js";

export const orderDetailRepository = {
  findByOrderId(orderId) {
    return OrderDetailModel.findAll({
      where: { orderId },
      include: [{
        model: ProductModel,
        as: "product",
        attributes: ["id", "name", "imageUrl"],
        required: false,
      }],
      order: [["id", "ASC"]],
    });
  },

  createMany(details, options = {}) {
    return OrderDetailModel.bulkCreate(details, options);
  },
};
