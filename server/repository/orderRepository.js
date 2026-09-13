import { pool } from "../config/database.js";
import { Order } from "../entity/Order.js";
import { AppError } from "../exception/AppError.js";

const orderColumns = `
  o.id, o.user_id, o.customer_name, o.phone, o.address,
  o.total_amount, o.status, o.note, o.created_at,
  oi.id AS item_id, oi.product_id, oi.product_name,
  oi.price AS item_price, oi.quantity, oi.sub_total
`;

const buildOrders = (rows) => {
  const grouped = new Map();

  for (const row of rows) {
    if (!grouped.has(row.id)) {
      grouped.set(row.id, new Order({
        id: row.id,
        userId: row.user_id,
        customerName: row.customer_name,
        phone: row.phone,
        address: row.address,
        totalAmount: Number(row.total_amount),
        status: row.status,
        note: row.note,
        createdAt: row.created_at,
        items: []
      }));
    }

    if (row.item_id !== null) {
      grouped.get(row.id).items.push({
        productId: row.product_id,
        productName: row.product_name,
        price: Number(row.item_price),
        quantity: Number(row.quantity),
        subTotal: Number(row.sub_total)
      });
    }
  }

  return [...grouped.values()];
};

const loadOrders = async (where = "", params = []) => {
  const [rows] = await pool.query(
    `SELECT ${orderColumns}
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     ${where}
     ORDER BY o.id DESC, oi.id ASC`,
    params
  );
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
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const quantities = new Map();
      for (const item of requestedItems) {
        const productId = normalizeId(item.productId);
        if (!productId) throw new AppError("Mã sản phẩm trong đơn hàng không hợp lệ", 400);
        quantities.set(productId, (quantities.get(productId) || 0) + Number(item.quantity));
      }

      const processedItems = [];
      let totalAmount = 0;

      for (const [productId, quantity] of quantities) {
        const [rows] = await connection.execute(
          `SELECT id, name, price, stock, status
           FROM products
           WHERE id = ?
           FOR UPDATE`,
          [productId]
        );
        const product = rows[0];

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

        await connection.execute(
          `UPDATE products
           SET stock = stock - ?,
               status = CASE WHEN stock - ? <= 0 THEN 'OUT_OF_STOCK' ELSE 'ACTIVE' END
           WHERE id = ?`,
          [quantity, quantity, productId]
        );
      }

      const [orderResult] = await connection.execute(
        `INSERT INTO orders
          (user_id, customer_name, phone, address, total_amount, status, note)
         VALUES (?, ?, ?, ?, ?, 'PENDING', ?)`,
        [
          orderEntity.userId,
          orderEntity.customerName,
          orderEntity.phone,
          orderEntity.address,
          totalAmount,
          orderEntity.note || null
        ]
      );

      for (const item of processedItems) {
        await connection.execute(
          `INSERT INTO order_items
            (order_id, product_id, product_name, price, quantity, sub_total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderResult.insertId, item.productId, item.productName, item.price, item.quantity, item.subTotal]
        );
      }

      await connection.commit();
      return this.findById(orderResult.insertId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateStatus(id, newStatus) {
    const orderId = normalizeId(id);
    if (!orderId) return null;
    const [result] = await pool.execute(
      "UPDATE orders SET status = ? WHERE id = ?",
      [newStatus, orderId]
    );
    if (result.affectedRows === 0) return null;
    return this.findById(orderId);
  },

  async cancelPending(id, userId = null) {
    const orderId = normalizeId(id);
    const normalizedUserId = normalizeId(userId);
    if (!orderId || (userId !== null && !normalizedUserId)) return null;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();
      const ownershipClause = normalizedUserId ? " AND user_id = ?" : "";
      const ownershipParams = normalizedUserId ? [orderId, normalizedUserId] : [orderId];
      const [orderRows] = await connection.execute(
        `SELECT id, status FROM orders WHERE id = ?${ownershipClause} FOR UPDATE`,
        ownershipParams
      );
      const order = orderRows[0];
      if (!order) throw new AppError("Không tìm thấy đơn hàng hoặc bạn không có quyền", 404);
      if (order.status !== "PENDING") {
        throw new AppError("Chỉ có thể hủy đơn hàng đang chờ duyệt", 400);
      }

      const [items] = await connection.execute(
        "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
        [orderId]
      );
      for (const item of items) {
        if (item.product_id === null) continue;
        await connection.execute(
          `UPDATE products
           SET stock = stock + ?, status = 'ACTIVE'
           WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      }

      await connection.execute("UPDATE orders SET status = 'CANCELLED' WHERE id = ?", [orderId]);
      await connection.commit();
      return this.findById(orderId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};
