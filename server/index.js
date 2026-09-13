import express from "express";
import cors from "cors";
import rootRouter from "./routes/index.js";
import { appConfig } from "./config/appConfig.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { securityHeaders } from "./middleware/security.js";

const app = express();
app.disable("x-powered-by");

// Middlewares toàn cục
app.use(cors({ origin: appConfig.clientOrigin, credentials: true }));
app.use(securityHeaders);
app.use(express.json({ limit: "1mb" }));

// Tổng đài Router
app.use(appConfig.apiPrefix, rootRouter);

// Bắt các đường link không tồn tại (404 Not Found)
app.use(notFoundHandler);

// Bắt lỗi toàn cục (Global Exception Handler)
app.use(errorHandler);

// Khởi động server
app.listen(appConfig.port, () => {
  console.log(`🚀 [TechStore Backend] Server đang chạy tại http://localhost:${appConfig.port}`);
});
