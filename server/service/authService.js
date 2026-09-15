import { Op } from "sequelize";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { userRepository } from "../repository/userRepository.js";
import { UserMapper } from "../mapper/userMapper.js";
import { AppError } from "../exception/AppError.js";
import { Role } from "../enums/Role.js";
import { User } from "../entity/User.js";
import { appConfig } from "../config/appConfig.js";
import { RefreshTokenModel } from "../models/index.js";

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Luôn chạy bcrypt.compare, kể cả khi username không tồn tại.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-never-used", 12);

const createAccessToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    appConfig.jwtSecret,
    { expiresIn: appConfig.jwtExpiresIn }
  );

const createRefreshToken = async (userId) => {
  const token = crypto.randomBytes(48).toString("base64url");
  const expiresAt = new Date(
    Date.now() + appConfig.refreshTokenDays * 24 * 60 * 60 * 1000
  );

  await RefreshTokenModel.create({
    userId,
    tokenHash: hashRefreshToken(token),
    expiresAt,
  });

  return token;
};

export const authService = {
  async login(loginDTO) {
    loginDTO.validate();

    // Chỉ truy vấn đúng một user.
    const user = await userRepository.findByUsername(loginDTO.username);

    // User không tồn tại vẫn chạy bcrypt.compare với hash giả.
    const passwordHash = user?.password || DUMMY_HASH;
    const passwordCorrect = await bcrypt.compare(
      loginDTO.password,
      passwordHash
    );

    // Không tiết lộ username có tồn tại hay không.
    if (!user || !passwordCorrect) {
      throw new AppError("Tên đăng nhập hoặc mật khẩu không đúng", 401);
    }

    return {
      token: createAccessToken(user),
      refreshToken: await createRefreshToken(user.id),
      user: UserMapper.toResponseDTO(user),
    };
  },

  async getCurrentUser(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Tài khoản không còn tồn tại", 401);
    return UserMapper.toResponseDTO(user);
  },

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new AppError("Refresh token không tồn tại", 401);
    }

    const tokenRecord = await RefreshTokenModel.findOne({
      where: {
        tokenHash: hashRefreshToken(refreshToken),
        revokedAt: null,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) {
      throw new AppError(
        "Refresh token không hợp lệ hoặc đã hết hạn",
        401
      );
    }

    const user = await userRepository.findById(tokenRecord.userId);
    if (!user) throw new AppError("Tài khoản không còn tồn tại", 401);

    await RefreshTokenModel.update(
      { revokedAt: new Date() },
      { where: { id: tokenRecord.id, revokedAt: null } }
    );

    return {
      token: createAccessToken(user),
      refreshToken: await createRefreshToken(user.id),
      user: UserMapper.toResponseDTO(user),
    };
  },

  async revokeRefreshToken(refreshToken) {
    if (!refreshToken) return;

    await RefreshTokenModel.update(
      { revokedAt: new Date() },
      {
        where: {
          tokenHash: hashRefreshToken(refreshToken),
          revokedAt: null,
        },
      }
    );
  },

  async register(registerDTO) {
    registerDTO.validate();

    const existingUser = await userRepository.findByUsername(
      registerDTO.username
    );
    if (existingUser) {
      throw new AppError(
        `Tên đăng nhập "${registerDTO.username}" đã được sử dụng`,
        400
      );
    }

    const newUser = new User({
      username: registerDTO.username,
      password: await bcrypt.hash(registerDTO.password, 12),
      fullName: registerDTO.fullName,
      role: Role.CUSTOMER,
      phone: registerDTO.phone,
      email: registerDTO.email,
    });

    const saved = await userRepository.create(newUser);
    return UserMapper.toResponseDTO(saved);
  },
};
