import { Op } from "sequelize";
import { InvoiceDetailModel, ProductModel } from "../models/index.js";
import { InvoiceDetail } from "../entity/InvoiceDetail.js";

const normalizeIds = (ids) => [...new Set(ids.map(Number))]
  .filter((id) => Number.isInteger(id) && id > 0);

const toEntity = (row) => {
  const data = row.get({ plain: true });
  return new InvoiceDetail({
    id: data.id,
    invoiceId: data.invoiceId,
    productId: data.productId,
    productName: data.productName,
    unitPrice: data.unitPrice,
    quantity: data.quantity,
    subTotal: data.subTotal,
    product: data.product
      ? {
          id: data.product.id,
          name: data.product.name,
          imageUrl: data.product.imageUrl,
        }
      : null,
  });
};

export const invoiceDetailRepository = {
  async findByInvoiceId(invoiceId) {
    return this.findByInvoiceIds([invoiceId]);
  },

  async findByInvoiceIds(invoiceIds) {
    const ids = normalizeIds(invoiceIds);
    if (ids.length === 0) return [];

    const rows = await InvoiceDetailModel.findAll({
      where: { invoiceId: { [Op.in]: ids } },
      include: [{
        model: ProductModel,
        as: "product",
        attributes: ["id", "name", "imageUrl"],
        required: false,
      }],
      order: [["invoiceId", "ASC"], ["id", "ASC"]],
    });
    return rows.map(toEntity);
  },

  createMany(details, options = {}) {
    return InvoiceDetailModel.bulkCreate(details, options);
  },
};
