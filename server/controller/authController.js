import { authService } from "../service/authService.js";
import { LoginDTO } from "../dto/request/authDTO.js";
import { RegisterDTO } from "../dto/request/authDTO.js";
import { appConfig } from "../config/appConfig.js";

const getRefreshToken = (req) => {
  const cookies = (req.headers.cookie || "").split(";");
  const entry = cookies.find(cookie => cookie.trim().startsWith(`${appConfig.refreshCookieName}=`));
  return entry ? decodeURIComponent(entry.trim().slice(appConfig.refreshCookieName.length + 1)) : null;
};

const setRefreshCookie = (res, token) => {
  res.cookie(appConfig.refreshCookieName, token, {
    httpOnly: true,
    secure: appConfig.cookieSecure,
    sameSite: "lax",
    maxAge: appConfig.refreshTokenDays * 24 * 60 * 60 * 1000,
    path: `${appConfig.apiPrefix}/auth`
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(appConfig.refreshCookieName, { path: `${appConfig.apiPrefix}/auth` });
};

export const authController = {
  async refresh(req, res, next) {
    try {
      const result = await authService.refresh(getRefreshToken(req));
      setRefreshCookie(res, result.refreshToken);
      res.json({ success: true, token: result.token, user: result.user });
    } catch (err) {
      clearRefreshCookie(res);
      next(err);
    }
  },

  async logout(req, res, next) {
    try {
      await authService.revokeRefreshToken(getRefreshToken(req));
      clearRefreshCookie(res);
      res.json({ success: true, message: "Đã đăng xuất" });
    } catch (err) {
      next(err);
    }
  },

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id);
      res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  },

  async login(req, res, next) {
    try {
      const dto = new LoginDTO(req.body);
      const result = await authService.login(dto);
      setRefreshCookie(res, result.refreshToken);
      res.json({
        success: true,
        message: `Chào mừng trở lại, ${result.user.fullName}! 👋`,
        token: result.token,
        user: result.user,
      });
    } catch (err) {
      next(err);
    }
  },

  async register(req, res, next) {
    try {
      const dto = new RegisterDTO(req.body);
      const user = await authService.register(dto);
      res.status(201).json({
        success: true,
        message: `Đăng ký tài khoản thành công! Chào mừng "${user.fullName}" đến với TechStore 🎉`,
        user,
      });
    } catch (err) {
      next(err);
    }
  },
};
