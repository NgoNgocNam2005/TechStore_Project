import { AppError } from "../../exception/AppError.js";
import { Role } from "../../enums/Role.js";

export class CreateEmployeeDTO {
  constructor(body) {
    this.username = body.username?.trim();
    this.password = body.password?.trim();
    this.fullName = body.fullName?.trim();
    this.role = body.role?.toUpperCase();
    this.phone = body.phone?.trim() || "";
    this.email = body.email?.trim() || "";
  }

  validate() {
    if (!this.username) throw new AppError("Tên đăng nhập không được để trống", 400);
    if (!this.password || this.password.length < 6) {
      throw new AppError("Mật khẩu nhân viên phải có ít nhất 6 ký tự", 400);
    }
    if (!this.fullName) throw new AppError("Họ tên nhân viên không được để trống", 400);
    if (![Role.SALER, Role.MANAGER, Role.ADMIN, Role.SHIPPER].includes(this.role)) {
      throw new AppError(`Chức vụ không hợp lệ. Chỉ chấp nhận: SALER, MANAGER, ADMIN`, 400);
    }
    if (this.email && !/^\S+@\S+\.\S+$/.test(this.email)) {
      throw new AppError("Email không hợp lệ", 400);
    }
  }
}

export class UpdateEmployeeDTO {
  constructor(body) {
    this.username = body.username?.trim();
    this.password = body.password?.trim();
    this.fullName = body.fullName?.trim();
    this.role = body.role?.toUpperCase();
    this.phone = body.phone?.trim();
    this.email = body.email?.trim();
  }

  validate() {
    if (this.username !== undefined && !this.username) {
      throw new AppError("Tên đăng nhập không được để trống", 400);
    }
    if (this.fullName !== undefined && !this.fullName) {
      throw new AppError("Họ tên nhân viên không được để trống", 400);
    }
    if (this.password !== undefined && this.password.length < 6) {
      throw new AppError("Mật khẩu phải có ít nhất 6 ký tự", 400);
    }
    if (this.role !== undefined && ![Role.SALER, Role.MANAGER, Role.ADMIN, Role.SHIPPER].includes(this.role)) {
      throw new AppError("Chức vụ không hợp lệ", 400);
    }
    if (this.email && !/^\S+@\S+\.\S+$/.test(this.email)) {
      throw new AppError("Email không hợp lệ", 400);
    }
  }
}
