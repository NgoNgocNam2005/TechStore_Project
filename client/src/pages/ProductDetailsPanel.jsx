const formatMoney = (amount) => new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
}).format(Number(amount) || 0);

export default function ProductDetailsPanel({
  product,
  loading = false,
  error = "",
  onClose,
}) {
  return (
    <div className="modal-backdrop product-details-backdrop" onClick={onClose}>
      <section
        className="modal-content product-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="product-details-title">Chi tiết sản phẩm</h3>
          <button className="btn-close" onClick={onClose} aria-label="Đóng">×</button>
        </div>

        {loading ? (
          <p className="empty-state">Đang tải thông tin sản phẩm...</p>
        ) : error ? (
          <p className="order-details-error" role="alert">{error}</p>
        ) : product ? (
          <div className="product-details-content">
            <img src={product.imageUrl} alt={product.name} />
            <div>
              <span className="brand-pill product-details-brand">{product.brand}</span>
              <h4>{product.name}</h4>
              <p className="product-details-price">{product.formattedPrice || formatMoney(product.price)}</p>
              <p>RAM: {product.specs?.ram || "—"}</p>
              <p>Bộ nhớ: {product.specs?.storage || "—"}</p>
              <p>Màu sắc: {product.specs?.color || "—"}</p>
              <p>Tồn kho: {product.stock ?? 0}</p>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
