import { InvoiceModel } from "../models/index.js";
import { Invoice } from "../entity/Invoice.js";

const normalizeId = (id) => {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
};

const toEntity = (row) => {
  if (!row) return null;
  const data = row.get({ plain: true });
  return new Invoice({
    id: data.id,
    userId: data.userId,
    customerName: data.customerName,
    phone: data.phone,
    address: data.address,
    totalAmount: Number(data.totalAmount),
    status: data.status,
    note: data.note,
    createdAt: data.createdAt,
  });
};

export const invoiceRepository = {
  async findByUserId(userId) {
    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId) return [];

    const rows = await InvoiceModel.findAll({
      where: { userId: normalizedUserId },
      order: [["createdAt", "DESC"], ["id", "DESC"]],
    });
    return rows.map(toEntity);
  },

  async findById(invoiceId) {
    const normalizedInvoiceId = normalizeId(invoiceId);
    if (!normalizedInvoiceId) return null;

    return toEntity(await InvoiceModel.findByPk(normalizedInvoiceId));
  },
};
