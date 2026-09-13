import mysql from "mysql2/promise";
import "dotenv/config";

// Khởi tạo Connection Pool kết nối MySQL
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_NAME || "techstore_db",
  charset: process.env.DB_CHARSET || "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Kiểm tra kết nối
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(" Kết nối thành công Cơ sở dữ liệu MySQL (techstore_db)!");
    connection.release();
    return true;
  } catch (err) {
    console.error("❌ Lỗi kết nối MySQL:", err.message);
    return false;
  }
};
