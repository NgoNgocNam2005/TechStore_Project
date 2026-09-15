import { Sequelize } from "sequelize";
import "dotenv/config";

export const sequelize = new Sequelize(
  process.env.DB_NAME || "techstore_db",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "123456",
  {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    dialectOptions: { charset: process.env.DB_CHARSET || "utf8mb4" },
    logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
);

export const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Kết nối thành công cơ sở dữ liệu MySQL (Sequelize)!");
    return true;
  } catch (error) {
    console.error("Lỗi kết nối MySQL:", error.message);
    return false;
  }
};
