export class OrderDetail {
  constructor({
    id,
    orderId,
    productId,
    productName,
    unitPrice,
    quantity,
    subTotal,
    product = null,
  }) {
    this.id = id;
    this.orderId = orderId;
    this.productId = productId;
    this.productName = productName;
    this.unitPrice = Number(unitPrice);
    this.price = this.unitPrice;
    this.quantity = Number(quantity);
    this.subTotal = Number(subTotal);
    this.product = product;
  }
}
