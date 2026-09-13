import { AppError } from "../../exception/AppError.js";

const phonePattern = /^[0-9+().\-\s]{8,20}$/;

export class UpdateProfileDTO {
  constructor(body) {
    this.fullName = body.fullName?.trim();
    this.phone = body.phone?.trim();
    this.email = body.email?.trim();
  }

  validate() {
    if (!this.fullName) throw new AppError("Họ và tên không được để trống", 400);
    if (this.fullName.length > 100) throw new AppError("Họ và tên không được quá 100 ký tự", 400);
    if (this.phone && !phonePattern.test(this.phone)) {
      throw new AppError("Số điện thoại không hợp lệ", 400);
    }
    if (this.email && !/^\S+@\S+\.\S+$/.test(this.email)) {
      throw new AppError("Email không hợp lệ", 400);
    }
  }
}

export class ChangePasswordDTO {
  constructor(body) {
    this.currentPassword = body.currentPassword?.trim();
    this.newPassword = body.newPassword?.trim();
    this.confirmPassword = body.confirmPassword?.trim();
  }

  validate() {
    if (!this.currentPassword) throw new AppError("Mật khẩu hiện tại không được để trống", 400);
    if (!this.newPassword || this.newPassword.length < 6) {
      throw new AppError("Mật khẩu mới phải có ít nhất 6 ký tự", 400);
    }
    if (this.newPassword !== this.confirmPassword) {
      throw new AppError("Mật khẩu xác nhận không khớp", 400);
    }
    if (this.currentPassword === this.newPassword) {
      throw new AppError("Mật khẩu mới phải khác mật khẩu hiện tại", 400);
    }
  }
}

export class CreateAddressDTO {
  constructor(body) {
    this.label = body.label?.trim() || "Nhà riêng";
    this.recipientName = body.recipientName?.trim();
    this.phone = body.phone?.trim();
    this.addressLine = body.addressLine?.trim();
    this.ward = body.ward?.trim() || "";
    this.district = body.district?.trim() || "";
    this.province = body.province?.trim() || "";
    this.isDefault = Boolean(body.isDefault);
  }

  validate() {
    if (!this.recipientName) throw new AppError("Tên người nhận không được để trống", 400);
    if (!this.phone || !phonePattern.test(this.phone)) throw new AppError("Số điện thoại không hợp lệ", 400);
    if (!this.addressLine) throw new AppError("Địa chỉ không được để trống", 400);
    if (this.label.length > 50) throw new AppError("Tên địa chỉ không được quá 50 ký tự", 400);
  }
}

export class UpdateAddressDTO extends CreateAddressDTO {
  constructor(body) {
    super(body);
    this.isDefault = body.isDefault === undefined ? undefined : Boolean(body.isDefault);
  }
}
