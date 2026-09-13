export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Đã xảy ra lỗi nội bộ trên hệ thống server";

  console.error(`[Error] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);

  res.status(statusCode).json({
    success: false,
    status: err.status || "error",
    statusCode,
    message,
    timestamp: new Date().toISOString()
  });
};