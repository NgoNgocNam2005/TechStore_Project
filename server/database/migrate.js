import { pool } from "../config/database.js";

const run = async () => {
  try {
    await pool.query(`
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

    await pool.query(`
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

    const [columns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'user_id'");

    const [statusColumns] = await pool.query("SHOW COLUMNS FROM orders LIKE 'status'");
    if (statusColumns[0] && !String(statusColumns[0].Type).includes("DELIVERED")) {
      await pool.query(
        "ALTER TABLE orders MODIFY status ENUM('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED') NOT NULL DEFAULT 'PENDING'"
      );
      console.log("Đã bổ sung trạng thái DELIVERED cho orders.status.");
    }

    if (columns.length === 0) {
      await pool.query("ALTER TABLE orders ADD COLUMN user_id BIGINT NULL AFTER id");

      const [customers] = await pool.query(
        "SELECT id FROM users WHERE role = 'CUSTOMER' ORDER BY id LIMIT 1"
      );
      if (customers.length === 0) {
        throw new Error("Không có tài khoản CUSTOMER để gán cho các đơn hàng cũ");
      }

      await pool.query("UPDATE orders SET user_id = ? WHERE user_id IS NULL", [customers[0].id]);
      await pool.query("ALTER TABLE orders MODIFY user_id BIGINT NOT NULL");
      await pool.query("ALTER TABLE orders ADD INDEX idx_order_user (user_id)");
      await pool.query(
        "ALTER TABLE orders ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT"
      );
      console.log("Đã migrate orders.user_id và liên kết các đơn cũ với CUSTOMER đầu tiên.");
    } else {
      console.log("orders.user_id đã tồn tại, không cần migrate.");
    }
  } finally {
    await pool.end();
  }
};

run().catch((error) => {
  console.error("Migration thất bại:", error.message);
  process.exitCode = 1;
});
