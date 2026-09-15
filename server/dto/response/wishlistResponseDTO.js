export class WishlistResponseDTO {
  constructor(wishlist) {
    this.id = wishlist.id;
    this.productId = wishlist.productId;
    this.addedAt = wishlist.addedAt;
    this.product = wishlist.product;
  }
}
