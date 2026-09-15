import { AppError } from "../../exception/AppError.js";

const phoneRegex = /^[0-9+().\-\s]{8,20}$/;

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
        if (!this.phone || !phoneRegex.test(this.phone)) throw new AppError("Số điện thoại không hợp lệ", 400);
        if (!this.addressLine) throw new AppError("Địa chỉ không được để trống", 400);
        if (this.label.length > 50) throw new AppError("Tên địa chỉ không được quá 50 ký tự", 400);    
    }
}

export class UpdateAddressDTO {
    constructor(body) {
    this.label = body.label?.trim();
    this.recipientName = body.recipientName?.trim();
    this.phone = body.phone?.trim();
    this.addressLine = body.addressLine?.trim();
    this.ward = body.ward?.trim();
    this.district = body.district?.trim();
    this.province = body.province?.trim();
    this.isDefault =
      body.isDefault === undefined
        ? undefined
        : Boolean(body.isDefault);
    }
    validate() {
        if (this.recipientName !== undefined && !this.recipientName) {
            throw new AppError("Tên người nhận không được để trống", 400);
        }
        if (this.phone !== undefined && !phoneRegex.test(this.phone)) {
            throw new AppError("Số điện thoại không hợp lệ", 400);
        }
        if (this.addressLine !== undefined && !this.addressLine) {
            throw new AppError("Địa chỉ không được để trống", 400);
        }
        if (this.label !== undefined && this.label.length > 50) {
            throw new AppError("Tên địa chỉ không được quá 50 ký tự", 400);
        }
    }
}