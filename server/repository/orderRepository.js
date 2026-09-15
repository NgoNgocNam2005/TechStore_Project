import { sequelize } from "../config/database.js";
import { OrderItemModel, OrderModel, ProductModel } from "../models/index.js";
import { Order } from "../entity/Order.js";
import { AppError } from "../exception/AppError.js";

const buildOrders = (rows) => {
  return rows.map((row) => {
    const data = row.get({ plain: true });
    return new Order({
      id: data.id,
      userId: data.userId,
      customerName: data.customerName,
      phone: data.phone,
      address: data.address,
      totalAmount: Number(data.totalAmount),
      status: data.status,
      note: data.note,
      createdAt: data.createdAt,
      items: (data.items || []).map((item) => ({
        productId: item.productId,
        productName: item.productName,
        price: Number(item.price),
        quantity: Number(item.quantity),
        subTotal: Number(item.subTotal)
      }))
    });
  });
};

const loadOrders = async (where = "", params = []) => {
  const options = {
    include: [{ model: OrderItemModel, as: "items", required: false }],
    order: [["id", "DESC"], [{ model: OrderItemModel, as: "items" }, "id", "ASC"]]
  };
  if (where === "WHERE o.user_id = ?") options.where = { userId: params[0] };
  if (where === "WHERE o.id = ?") options.where = { id: params[0] };
  const rows = await OrderModel.findAll(options);
  return buildOrders(rows);
};

const normalizeId = (id) => {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
};

export const orderRepository = {
  async findAll() {
    return loadOrders();
  },

  async findByUserId(userId) {
    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId) return [];
    return loadOrders("WHERE o.user_id = ?", [normalizedUserId]);
  },

  async findById(id) {
    const orderId = normalizeId(id);
    if (!orderId) return null;
    const orders = await loadOrders("WHERE o.id = ?", [orderId]);
    return orders[0] || null;
  },

  async createWithTransaction({ orderEntity, requestedItems }) {
    const transaction = await sequelize.transaction();

    try {
      const quantities = new Map();
      for (const item of requestedItems) {
        const productId = normalizeId(item.productId);
        if (!productId) throw new AppError("Mã sản phẩm trong đơn hàng không hợp lệ", 400);
        quantities.set(productId, (quantities.get(productId) || 0) + Number(item.quantity));
      }

      const processedItems = [];
      let totalAmount = 0;

      for (const [productId, quantity] of quantities) {
        const product = await ProductModel.findByPk(productId, {
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!product) {
          throw new AppError(`Sản phẩm mã #${productId} không tồn tại`, 404);
        }
        if (Number(product.stock) < quantity) {
          throw new AppError(
            `Sản phẩm "${product.name}" chỉ còn ${product.stock} chiếc trong kho (bạn đang đặt ${quantity})`,
            400
          );
        }

        const price = Number(product.price);
        const subTotal = price * quantity;
        totalAmount += subTotal;
        processedItems.push({
          productId,
          productName: product.name,
          price,
          quantity,
          subTotal
        });

        await product.update({
          stock: Number(product.stock) - quantity,
          status: Number(product.stock) - quantity <= 0 ? "OUT_OF_STOCK" : "ACTIVE"
        }, { transaction });
      }

      const order = await OrderModel.create({
        userId: orderEntity.userId,
        customerName: orderEntity.customerName,
        phone: orderEntity.phone,
        address: orderEntity.address,
        totalAmount,
        status: "PENDING",
        note: orderEntity.note || null
      }, { transaction });

      await OrderItemModel.bulkCreate(
        processedItems.map((item) => ({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          price: item.price,
          quantity: item.quantity,
          subTotal: item.subTotal
        })),
        { transaction }
      );

      await transaction.commit();
      return this.findById(order.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async updateStatus(id, newStatus) {
    const orderId = normalizeId(id);
    if (!orderId) return null;
    const [affected] = await OrderModel.update(
      { status: newStatus },
      { where: { id: orderId } }
    );
    if (affected === 0) return null;
    return this.findById(orderId);
  },

  async cancelPending(id, userId = null) {
    const orderId = normalizeId(id);
    const normalizedUserId = normalizeId(userId);
    if (!orderId || (userId !== null && !normalizedUserId)) return null;
    const transaction = await sequelize.transaction();

    try {
      const where = normalizedUserId
        ? { id: orderId, userId: normalizedUserId }
        : { id: orderId };
      const order = await OrderModel.findOne({
        where,
        attributes: ["id", "status"],
        include: [{
          model: OrderItemModel,
          as: "items",
          attributes: ["productId", "quantity"]
        }],
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!order) throw new AppError("Không tìm thấy đơn hàng hoặc bạn không có quyền", 404);
      if (order.status !== "PENDING") {
        throw new AppError("Chỉ có thể hủy đơn hàng đang chờ duyệt", 400);
      }

      for (const item of order.items || []) {
        if (item.productId === null) continue;
        await ProductModel.increment(
          { stock: item.quantity },
          { where: { id: item.productId }, transaction }
        );
        await ProductModel.update(
          { status: "ACTIVE" },
          { where: { id: item.productId }, transaction }
        );
      }

      await OrderModel.update(
        { status: "CANCELLED" },
        { where: { id: orderId }, transaction }
      );
      await transaction.commit();
      return this.findById(orderId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};
