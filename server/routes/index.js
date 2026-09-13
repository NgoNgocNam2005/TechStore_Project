import express from "express";
import productRoute from "./productRoute.js";
import orderRoute from "./orderRoute.js";
import userRoute from "./userRoute.js";
import authRoute from "./authRoute.js";
import { appConfig } from "../config/appConfig.js";

const rootRouter = express.Router();

// 1. Healthcheck / Thông tin cửa hàng
rootRouter.get("/status", (req, res) => {
  res.json({
    status: "online",
    storeName: appConfig.storeName,
    message: "Hệ thống Backend TechStore đang hoạt động trơn tru!",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + "s"
  });
});

// 2. Chia nhánh đường dẫn theo từng phân hệ nghiệp vụ
rootRouter.use("/auth", authRoute);        // -> /api/auth
rootRouter.use("/products", productRoute); // -> /api/products
rootRouter.use("/orders", orderRoute);     // -> /api/orders
rootRouter.use("/users", userRoute);       // -> /api/users

export default rootRouter;