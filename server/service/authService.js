import { userRepository } from "../repository/userRepository.js";
import { UserMapper } from "../mapper/userMapper.js";
import { AppError } from "../exception/AppError.js";
import { Role } from "../enums/Role.js";
import { User } from "../entity/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { appConfig } from "../config/appConfig.js";
import { pool } from "../config/database.js";

const hashRefreshToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createAccessToken = (user) => jwt.sign(
  { id: user.id, username: user.username, role: user.role },
  appConfig.jwtSecret,
  { expiresIn: appConfig.jwtExpiresIn }
);

const createRefreshToken = async (userId) => {
  const token = crypto.randomBytes(48).toString("base64url");
  const expiresAt = new Date(Date.now() + appConfig.refreshTokenDays * 24 * 60 * 60 * 1000);
  await pool.execute(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, hashRefreshToken(token), expiresAt]
  );
  return token;
};

export const authService = {
  async login(loginDTO) {
    loginDTO.validate();
    const user = await userRepository.findByUsername(loginDTO.username);

    if (!user) {
      throw new AppError("Tên đăng nhập không tồn tại trên hệ thống", 401);
    }
    if (!(await bcrypt.compare(loginDTO.password, user.password))) {
      throw new AppError("Mật khẩu không chính xác", 401);
    }

    return {
      token: createAccessToken(user),
      refreshToken: await createRefreshToken(user.id),
      user: UserMapper.toResponseDTO(user)
    };
  },

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Tài khoản không còn tồn tại", 401);
    return UserMapper.toResponseDTO(user);
  },

  async refresh(refreshToken) {
    if (!refreshToken) throw new AppError("Refresh token không tồn tại", 401);

    const tokenHash = hashRefreshToken(refreshToken);
    const [rows] = await pool.query(
      `SELECT rt.id, rt.user_id
       FROM refresh_tokens rt
       WHERE rt.token_hash = ?
         AND rt.revoked_at IS NULL
         AND rt.expires_at > NOW()`,
      [tokenHash]
    );
    if (rows.length === 0) throw new AppError("Refresh token không hợp lệ hoặc đã hết hạn", 401);

    const user = await userRepository.findById(rows[0].user_id);
    if (!user) throw new AppError("Tài khoản không còn tồn tại", 401);

    await pool.execute("UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = ?", [rows[0].id]);
    return {
      token: createAccessToken(user),
      refreshToken: await createRefreshToken(user.id),
      user: UserMapper.toResponseDTO(user)
    };
  },

  async revokeRefreshToken(refreshToken) {
    if (!refreshToken) return;
    await pool.execute(
      "UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL",
      [hashRefreshToken(refreshToken)]
    );
  },

  async register(registerDTO) {
    registerDTO.validate();
    const existingUser = await userRepository.findByUsername(registerDTO.username);
    if (existingUser) {
      throw new AppError(`Tên đăng nhập "${registerDTO.username}" đã được sử dụng`, 400);
    }

    const newUser = new User({
      username: registerDTO.username,
      password: await bcrypt.hash(registerDTO.password, 12),
      fullName: registerDTO.fullName,
      role: Role.CUSTOMER,
      phone: registerDTO.phone,
      email: registerDTO.email
    });

    const saved = await userRepository.create(newUser);
    return UserMapper.toResponseDTO(saved);
  }
};
