export class Invoice {
    constructor({
        id,
        userId,
        customerName,
        phone,
        address,
        totalAmount,
        status,
        note,
        createdAt,
        details = [],
    }) {
        this.id = id;
        this.userId = userId;
        this.customerName = customerName;
        this.phone = phone;
        this.address = address;
        this.totalAmount = totalAmount;
        this.status = status;
        this.note = note;
        this.createdAt = createdAt;
        this.details = details;
    }
}
