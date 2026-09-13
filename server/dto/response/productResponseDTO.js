export class ProductResponseDTO {
  constructor(product) {
    this.id = product.id;
    this.name = product.name;
    this.brand = product.brand;
    this.price = product.price;
    this.formattedPrice = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(product.price);
    this.stock = product.stock;
    this.isAvailable = product.stock > 0;
    this.specs = product.specs;
    this.imageUrl = product.imageUrl;
    this.status = product.status;
    this.createdAt = new Date(product.createdAt).toLocaleDateString("vi-VN");
  }
}