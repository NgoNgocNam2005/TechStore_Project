const statusLabels = {
  PENDING: "Chờ duyệt",
  CONFIRMED: "Đã xác nhận",
  SHIPPED: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
};

export class InvoiceResponseDTO {
  constructor(invoice) {
    const details = (invoice.details || []).map((detail) => ({
      id: detail.id,
      invoiceId: detail.invoiceId,
      productId: detail.productId,
      productName: detail.productName,
      unitPrice: Number(detail.unitPrice),
      quantity: Number(detail.quantity),
      subTotal: Number(detail.subTotal),
      product: detail.product
        ? {
            id: detail.product.id,
            name: detail.product.name,
            imageUrl: detail.product.imageUrl,
          }
        : null,
    }));

    this.id = invoice.id;
    this.customerName = invoice.customerName;
    this.phone = invoice.phone;
    this.address = invoice.address;
    this.details = details;
    // Giữ tên `items` để tương thích với giao diện đơn hàng hiện tại.
    this.items = details.map((detail) => ({
      ...detail,
      price: detail.unitPrice,
    }));
    this.itemCount = details.reduce((total, detail) => total + detail.quantity, 0);
    this.totalAmount = Number(invoice.totalAmount);
    this.formattedTotal = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(this.totalAmount);
    this.status = invoice.status;
    this.statusText = statusLabels[invoice.status] || invoice.status;
    this.note = invoice.note;
    this.createdAt = invoice.createdAt
      ? new Date(invoice.createdAt).toLocaleString("vi-VN")
      : null;
  }
}
