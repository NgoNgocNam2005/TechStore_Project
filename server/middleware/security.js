const loginAttempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 30;

export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
};

export const authRateLimit = (req, res, next) => {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  const current = loginAttempts.get(key);

  if (!current || now - current.startedAt > WINDOW_MS) {
    loginAttempts.set(key, { startedAt: now, count: 1 });
    return next();
  }

  if (current.count >= MAX_ATTEMPTS) {
    return res.status(429).json({
      success: false,
      status: "fail",
      statusCode: 429,
      message: "Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ít phút."
    });
  }

  current.count += 1;
  return next();
};
