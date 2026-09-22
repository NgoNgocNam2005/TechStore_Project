import { AppError } from "../../exception/AppError.js";

export class CreateOrderDTO {
  constructor(body) {
    this.customerName = body.customerName?.trim();
    this.phone = body.phone?.trim();
    this.address = body.address?.trim();
    this.items = body.items || []; // [{ productId, quantity }]
    this.note = body.note?.trim() || "";
    this.paymentMethod = body.paymentMethod?.trim().toUpperCase() || "COD";
    this.userId = undefined;
  }

  validate() {
    if (!this.customerName) throw new AppError("Vui lòng nhập họ tên người nhận hàng", 400);
    if (!this.phone) throw new AppError("Vui lòng nhập số điện thoại người nhận", 400);
    if (!this.address) throw new AppError("Vui lòng nhập địa chỉ nhận hàng", 400);
    if (!Array.isArray(this.items) || this.items.length === 0) {
      throw new AppError("Đơn hàng phải có ít nhất 1 sản phẩm", 400);
    }
    if (this.paymentMethod !== "COD") {
      throw new AppError("Phuong thuc thanh toan chua duoc ho tro", 400);
    }
    for (const item of this.items) {
      if (!Number.isInteger(Number(item.productId)) || Number(item.productId) <= 0) {
        throw new AppError("Mã sản phẩm trong đơn hàng không hợp lệ", 400);
      }
      if (!Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0) {
        throw new AppError("Số lượng đặt mua phải là số nguyên lớn hơn 0", 400);
      }
    }
  }
}
