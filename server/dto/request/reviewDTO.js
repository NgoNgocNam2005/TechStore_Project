import { AppError } from "../../exception/AppError.js";

export class CreateReviewDTO {
  constructor(body) {
    this.rating = Number(body.rating);
    this.comment = body.comment?.trim() || "";
  }

  validate() {
    if (
      !Number.isInteger(this.rating) ||
      this.rating < 1 ||
      this.rating > 5
    ) {
      throw new AppError(
        "Điểm đánh giá phải là số nguyên từ 1 đến 5",
        400
      );
    }

    if (this.comment.length > 1000) {
      throw new AppError(
        "Nội dung đánh giá không được quá 1000 ký tự",
        400
      );
    }
  }
}

export class UpdateReviewDTO {
  constructor(body) {
    this.rating =
      body.rating === undefined ? undefined : Number(body.rating);

    this.comment =
      body.comment === undefined ? undefined : body.comment.trim();
  }

  validate() {
    if (this.rating === undefined && this.comment === undefined) {
      throw new AppError(
        "Cần có nội dung cần cập nhật",
        400
      );
    }

    if (
      this.rating !== undefined &&
      (!Number.isInteger(this.rating) ||
        this.rating < 1 ||
        this.rating > 5)
    ) {
      throw new AppError(
        "Điểm đánh giá phải là số nguyên từ 1 đến 5",
        400
      );
    }

    if (
      this.comment !== undefined &&
      this.comment.length > 1000
    ) {
      throw new AppError(
        "Nội dung đánh giá không được quá 1000 ký tự",
        400
      );
    }
  }
}