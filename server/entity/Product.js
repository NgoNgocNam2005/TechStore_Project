export class Product {
  constructor({ id, name, brand, price, stock, specs, imageUrl, status, createdAt, updatedAt }) {
    this.id = id || Date.now();
    this.name = name;
    this.brand = brand; // Apple, Samsung, Xiaomi, etc.
    this.price = Number(price);
    this.stock = Number(stock) || 0;
    this.specs = {
      ram: specs?.ram || "8GB",
      storage: specs?.storage || "128GB",
      color: specs?.color || "Đen",
      ...(specs?.chip ? { chip: specs.chip } : {})
    };
    this.imageUrl = imageUrl || "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80";
    this.status = status || "ACTIVE"; // ACTIVE, OUT_OF_STOCK
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }
}
