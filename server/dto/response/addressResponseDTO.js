export class AddressResponseDTO {
  constructor(address) {
    this.id = address.id;
    this.label = address.label;
    this.recipientName = address.recipientName;
    this.phone = address.phone;
    this.addressLine = address.addressLine;
    this.ward = address.ward;
    this.district = address.district;
    this.province = address.province;
    this.isDefault = address.isDefault;
    this.createdAt = address.createdAt;
    this.updatedAt = address.updatedAt;
  }
}
