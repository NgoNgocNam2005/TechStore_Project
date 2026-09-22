import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const run = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_refresh_user (user_id),
        INDEX idx_refresh_expiry (expires_at),
        CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("Đã kiểm tra bảng refresh_tokens.");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        label VARCHAR(50) NOT NULL DEFAULT 'Nhà riêng',
        recipient_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address_line TEXT NOT NULL,
        ward VARCHAR(100),
        district VARCHAR(100),
        province VARCHAR(100),
        is_default BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_address_user (user_id),
        CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("Đã kiểm tra bảng addresses.");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS wishlists (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_product (user_id, product_id),
        INDEX idx_wishlist_user (user_id),
        CONSTRAINT fk_wishlist_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("Đã kiểm tra bảng wishlists.");

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        user_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        quantity INT NOT NULL CHECK (quantity > 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_cart_user_product (user_id, product_id),
        INDEX idx_cart_user (user_id),
        CONSTRAINT fk_cart_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log("Đã kiểm tra bảng cart_items.");

    const roleColumns = await sequelize.query("SHOW COLUMNS FROM users LIKE 'role'", {
      type: QueryTypes.SELECT
    });
    if (roleColumns[0] && !String(roleColumns[0].Type).includes("SHIPPER")) {
      await sequelize.query(
        "ALTER TABLE users MODIFY role ENUM('CUSTOMER', 'MANAGER', 'ADMIN', 'SALER', 'SHIPPER') NOT NULL DEFAULT 'SALER'"
      );
      console.log("Đã bổ sung role SHIPPER cho users.role.");
    }

    const columns = await sequelize.query("SHOW COLUMNS FROM orders LIKE 'user_id'", {
      type: QueryTypes.SELECT
    });

    const statusColumns = await sequelize.query("SHOW COLUMNS FROM orders LIKE 'status'", {
      type: QueryTypes.SELECT
    });
    if (statusColumns[0] && !String(statusColumns[0].Type).includes("DELIVERED")) {
      await sequelize.query(
        "ALTER TABLE orders MODIFY status ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING'"
      );
      console.log("Đã bổ sung trạng thái DELIVERED cho orders.status.");
    }

    const paymentMethodColumns = await sequelize.query(
      "SHOW COLUMNS FROM orders LIKE 'payment_method'",
      { type: QueryTypes.SELECT }
    );
    if (paymentMethodColumns.length === 0) {
      await sequelize.query(
        "ALTER TABLE orders ADD COLUMN payment_method VARCHAR(30) NOT NULL DEFAULT 'COD' AFTER status"
      );
      console.log("Đã bổ sung orders.payment_method.");
    }

    const paymentStatusColumns = await sequelize.query(
      "SHOW COLUMNS FROM orders LIKE 'payment_status'",
      { type: QueryTypes.SELECT }
    );
    if (paymentStatusColumns.length === 0) {
      await sequelize.query(
        "ALTER TABLE orders ADD COLUMN payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID' AFTER payment_method"
      );
      console.log("Đã bổ sung orders.payment_status.");
    }

    if (columns.length === 0) {
      await sequelize.query("ALTER TABLE orders ADD COLUMN user_id BIGINT NULL AFTER id");

      const customers = await sequelize.query(
        "SELECT id FROM users WHERE role = 'CUSTOMER' ORDER BY id LIMIT 1",
        { type: QueryTypes.SELECT }
      );
      if (customers.length === 0) {
        throw new Error("Không có tài khoản CUSTOMER để gán cho các đơn hàng cũ");
      }

      await sequelize.query("UPDATE orders SET user_id = ? WHERE user_id IS NULL", {
        replacements: [customers[0].id]
      });
      await sequelize.query("ALTER TABLE orders MODIFY user_id BIGINT NOT NULL");
      await sequelize.query("ALTER TABLE orders ADD INDEX idx_order_user (user_id)");
      await sequelize.query(
        "ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT"
      );
      console.log("Đã migrate orders.user_id và liên kết các đơn cũ với CUSTOMER đầu tiên.");
    } else {
      console.log("orders.user_id đã tồn tại, không cần migrate.");
    }
  } finally {
    await sequelize.close();
  }
};

run().catch((error) => {
  console.error("Migration thất bại:", error.message);
  process.exitCode = 1;
});
