import { useEffect, useState } from "react";

export default function ReviewPanel({
  product,
  currentUser,
  authHeaders,
  onClose,
  onToast,
  onSessionExpired
}) {
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [loading, setLoading] = useState(false);

  const loadReviews = async () => {
    const response = await fetch(
      `/api/products/${product.id}/reviews`
    );
    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || "Không thể tải đánh giá");
    }

    setReviews(result.data || []);
  };

  useEffect(() => {
    void loadReviews().catch(error => onToast(error.message, "error"));
  }, [product.id]);

  const submitReview = async event => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `/api/products/${product.id}/reviews`,
        {
          method: "POST",
          headers: authHeaders(true),
          body: JSON.stringify(form)
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        onSessionExpired();
        throw new Error("Phiên đăng nhập đã hết hạn");
      }

      if (!response.ok) {
        throw new Error(result.message || "Không thể gửi đánh giá");
      }

      setReviews(items => [result.data, ...items]);
      setForm({ rating: 5, comment: "" });
      onToast("Đã gửi đánh giá sản phẩm");
    } catch (error) {
      onToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async reviewId => {
    if (!window.confirm("Bạn có chắc muốn xóa đánh giá này?")) return;

    try {
      const response = await fetch(
        `/api/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: authHeaders()
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.status === 401) {
        onSessionExpired();
        throw new Error("Phiên đăng nhập đã hết hạn");
      }

      if (!response.ok) {
        throw new Error(result.message || "Không thể xóa đánh giá");
      }

      setReviews(items => items.filter(item => item.id !== reviewId));
      onToast("Đã xóa đánh giá");
    } catch (error) {
      onToast(error.message, "error");
    }
  };

  const ownReview = reviews.find(
    review => Number(review.userId) === Number(currentUser.id)
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content review-modal" onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>⭐ Đánh giá sản phẩm</h3>
            <p className="review-product-name">{product.name}</p>
          </div>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {currentUser.role === "CUSTOMER" && !ownReview && (
          <form className="review-form" onSubmit={submitReview}>
            <label>Đánh giá của bạn</label>
            <div className="star-picker" role="radiogroup" aria-label="Số sao">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  className={star <= form.rating ? "selected" : ""}
                  onClick={() => setForm(previous => ({ ...previous, rating: star }))}
                  aria-label={`${star} sao`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              className="review-textarea"
              value={form.comment}
              onChange={event => setForm(previous => ({ ...previous, comment: event.target.value }))}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              maxLength={1000}
              rows={4}
            />
            <button className="btn-primary" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </form>
        )}

        {ownReview && (
          <p className="review-note">Bạn đã đánh giá sản phẩm này.</p>
        )}

        <div className="review-list">
          {reviews.length === 0 ? (
            <p className="empty-state">Sản phẩm chưa có đánh giá.</p>
          ) : (
            reviews.map(review => (
              <article className="review-item" key={review.id}>
                <div className="review-item-header">
                  <strong>{review.authorName || "Khách hàng"}</strong>
                  <span className="review-date">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString("vi-VN")
                      : ""}
                  </span>
                </div>
                <div className="review-stars">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</div>
                {review.comment && <p>{review.comment}</p>}
                {Number(review.userId) === Number(currentUser.id) && (
                  <button className="btn-danger" onClick={() => deleteReview(review.id)}>
                    Xóa đánh giá
                  </button>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
