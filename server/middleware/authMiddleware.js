import jwt from "jsonwebtoken";
import { appConfig } from "../config/appConfig.js";
import { AppError } from "../exception/AppError.js";

export const authenticate = (req, res, next) => {
  try {
    const [scheme, token] = (req.headers.authorization || "").split(" ");
    if (scheme !== "Bearer" || !token) throw new AppError("Bạn chưa đăng nhập", 401);
    req.user = jwt.verify(token, appConfig.jwtSecret);
    next();
  } catch (err) {
    next(err instanceof AppError ? err : new AppError("Token không hợp lệ hoặc đã hết hạn", 401));
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(new AppError("Bạn không có quyền thực hiện thao tác này", 403));
  next();
};
