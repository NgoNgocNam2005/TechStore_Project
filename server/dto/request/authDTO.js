import { AppError } from "../../exception/AppError.js";

export class LoginDTO {
  constructor(body) {
    this.username = body.username?.trim();
    this.password = body.password?.trim();
  }

  validate() {
    if (!this.username) throw new AppError("Tên đăng nhập không được để trống", 400);
    if (!this.password) throw new AppError("Mật khẩu không được để trống", 400);
  }
}

export class RegisterDTO {
  constructor(body) {
    this.username = body.username?.trim();
    this.password = body.password?.trim();
    this.fullName = body.fullName?.trim();
    this.phone = body.phone?.trim() || "";
    this.email = body.email?.trim() || "";
  }

  validate() {
    if (!this.username) throw new AppError("Tên đăng nhập không được để trống", 400);
    if (!this.password) throw new AppError("Mật khẩu không được để trống", 400);
    if (this.password.length < 6) throw new AppError("Mật khẩu phải có ít nhất 6 ký tự", 400);
    if (!this.fullName) throw new AppError("Họ và tên không được để trống", 400);
    if (this.email && !/^\S+@\S+\.\S+$/.test(this.email)) {
      throw new AppError("Email không hợp lệ", 400);
    }
  }
}
