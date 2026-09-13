export class Address {
  constructor({
    id,
    userId,
    label,
    recipientName,
    phone,
    addressLine,
    ward,
    district,
    province,
    isDefault,
    createdAt,
    updatedAt
  }) {
    this.id = id;
    this.userId = userId;
    this.label = label || "Nhà riêng";
    this.recipientName = recipientName;
    this.phone = phone;
    this.addressLine = addressLine;
    this.ward = ward || "";
    this.district = district || "";
    this.province = province || "";
    this.isDefault = Boolean(isDefault);
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
