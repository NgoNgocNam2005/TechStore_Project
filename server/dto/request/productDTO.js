import { AppError } from "../../exception/AppError.js";

export class CreateProductDTO {
  constructor(body) {
    this.name = body.name?.trim();
    this.brand = body.brand?.trim();
    this.price = Number(body.price);
    this.stock = Number(body.stock ?? 0);
    this.specs = body.specs || { ram: "8GB", storage: "128GB", color: "Tiêu chuẩn" };
    this.imageUrl = body.imageUrl?.trim() || "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80";
  }

  validate() {
    if (!this.name) throw new AppError("Tên điện thoại không được để trống", 400);
    if (!this.brand) throw new AppError("Thương hiệu (Hãng) không được để trống", 400);
    if (isNaN(this.price) || this.price <= 0) throw new AppError("Giá bán phải là số lớn hơn 0", 400);
    if (isNaN(this.stock) || this.stock < 0) throw new AppError("Số lượng tồn kho không được âm", 400);
  }
}

export class UpdateProductDTO {
  constructor(body) {
    this.name = body.name?.trim();
    this.brand = body.brand?.trim();
    this.price = body.price !== undefined ? Number(body.price) : undefined;
    this.stock = body.stock !== undefined ? Number(body.stock) : undefined;
    this.specs = body.specs;
    this.imageUrl = body.imageUrl?.trim();
  }

  validate() {
    if (this.name !== undefined && !this.name) {
      throw new AppError("Tên điện thoại cập nhật không được để trống", 400);
    }
    if (this.brand !== undefined && !this.brand) {
      throw new AppError("Thương hiệu cập nhật không được để trống", 400);
    }
    if (this.price !== undefined && (isNaN(this.price) || this.price <= 0)) {
      throw new AppError("Giá bán cập nhật phải lớn hơn 0", 400);
    }
    if (this.stock !== undefined && (isNaN(this.stock) || this.stock < 0)) {
      throw new AppError("Số lượng tồn kho cập nhật không được âm", 400);
    }
  }
}
