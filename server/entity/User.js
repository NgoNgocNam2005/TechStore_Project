import { Role } from "../enums/Role.js";

export class User {
  constructor({ id, username, password, fullName, role, phone, email, createdAt }) {
    this.id = id || Date.now();
    this.username = username;
    this.password = password; // Mật khẩu (sẽ được ẩn qua UserResponseDTO)
    this.fullName = fullName;
    this.role = role || Role.SALER;
    this.phone = phone || "";
    this.email = email || "";
    this.createdAt = createdAt || new Date();
  }
}