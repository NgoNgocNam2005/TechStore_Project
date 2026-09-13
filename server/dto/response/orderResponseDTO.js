export class OrderResponseDTO {
  constructor(order) {
    this.id = order.id;
    this.customerName = order.customerName;
    this.phone = order.phone;
    this.address = order.address;
    this.items = order.items;
    this.itemCount = order.items.reduce((acc, cur) => acc + cur.quantity, 0);
    this.totalAmount = order.totalAmount;
    this.formattedTotal = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(order.totalAmount);
    this.status = order.status;
    this.statusText = this._getStatusText(order.status);
    this.note = order.note;
    this.createdAt = new Date(order.createdAt).toLocaleString("vi-VN");
  }

  _getStatusText(status) {
    switch (status) {
      case "PENDING": return "Chờ duyệt";
      case "CONFIRMED": return "Đã xác nhận";
      case "SHIPPED": return "Đang giao";
      case "DELIVERED": return "Đã giao";
      case "CANCELLED": return "Đã hủy";
      default: return status;
    }
  }
}
