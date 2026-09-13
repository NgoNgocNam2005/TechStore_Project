export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = statusCode >= 500 && !err.isOperational
    ? "Đã xảy ra lỗi nội bộ trên hệ thống"
    : (err.message || "Đã xảy ra lỗi nội bộ trên hệ thống");
  console.error(`[Error] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);
  res.status(statusCode).json({ success: false, status: err.status || "error", statusCode, message, timestamp: new Date().toISOString() });
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, statusCode: 404, message: `Đường dẫn [${req.method}] ${req.originalUrl} không tồn tại` });
};
