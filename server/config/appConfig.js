import "dotenv/config";

const environment = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET || "techstore_dev_secret_key_2026";

if (environment === "production" && !process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET phải được cấu hình khi chạy production");
}

export const appConfig = {
  port: process.env.PORT || 5000,
  env: environment,
  storeName: "TechStore - Cửa Hàng Điện Thoại Chính Hãng",
  apiPrefix: "/api",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS) || 30,
  refreshCookieName: "techstore_refresh",
  cookieSecure: environment === "production",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173"
};
