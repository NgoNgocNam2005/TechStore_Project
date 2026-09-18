export class InvoiceDetail {
  constructor({
    id,
    invoiceId,
    productId,
    productName,
    unitPrice,
    quantity,
    subTotal,
    product = null,
  }) {
    this.id = id;
    this.invoiceId = invoiceId;
    this.productId = productId;
    this.productName = productName;
    this.unitPrice = Number(unitPrice);
    this.quantity = Number(quantity);
    this.subTotal = Number(subTotal);
    this.product = product;
  }
}
