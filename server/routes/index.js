import express from "express";
import productRoute from "./productRoute.js";
import orderRoute from "./orderRoute.js";
import userRoute from "./userRoute.js";
import authRoute from "./authRoute.js";
import reviewRoute from "./reviewRoute.js";
import invoiceRoute from "./invoiceRoute.js";
import { appConfig } from "../config/appConfig.js";

const rootRouter = express.Router();

// Health check
rootRouter.get("/status", (req, res) => {
  res.json({
    status: "online",
    storeName: appConfig.storeName,
    message: "Hệ thống Backend TechStore đang hoạt động trơn tru!",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// Các module
rootRouter.use("/auth", authRoute);
rootRouter.use("/products", productRoute);
rootRouter.use("/orders", orderRoute);
rootRouter.use("/invoices", invoiceRoute);
rootRouter.use("/users", userRoute);

// reviewRoute đã chứa sẵn /products/... và /reviews/...
rootRouter.use(reviewRoute);

export default rootRouter;
