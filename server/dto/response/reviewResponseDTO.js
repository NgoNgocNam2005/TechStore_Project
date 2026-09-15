export class reviewResponseDTO {
    constructor(review) {
    this.id = review.id;
    this.userId = review.userId;
    this.productId = review.productId;
    this.authorName = review.authorName;
    this.rating = review.rating;
    this.comment = review.comment;
    this.createdAt = review.createdAt;
    this.updatedAt = review.updatedAt;
  }
}