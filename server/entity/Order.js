import { OrderStatus } from "../enums/OrderStatus.js";

export class Order {
  constructor({ id, userId, customerName, phone, address, items, totalAmount, status, paymentMethod, paymentStatus, note, createdAt }) {
    this.id = id || Date.now();
    this.userId = userId;
    this.customerName = customerName;
    this.phone = phone;
    this.address = address;
    this.items = items || []; // [{ productId, productName, price, quantity }]
    this.totalAmount = totalAmount || 0;
    this.status = status || OrderStatus.PENDING;
    this.paymentMethod = paymentMethod || "COD";
    this.paymentStatus = paymentStatus || "UNPAID";
    this.note = note || "";
    this.createdAt = createdAt || new Date();
  }
}
