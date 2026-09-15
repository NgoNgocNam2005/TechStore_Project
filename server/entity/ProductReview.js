export class ProductReview {
    constructor({
        id,
        productId,
        userId,
        rating,
        comment,
        authorName,
        createdAt,
        updatedAt
    }) {
        this.id = id;
        this.productId = productId;
        this.userId = userId;
        this.rating = rating;
        this.comment = comment;
        this.authorName = authorName;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    };
}