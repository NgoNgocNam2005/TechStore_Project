const formatMoney = (amount) => new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
}).format(Number(amount) || 0);

export default function OrderDetailsPanel({
  order,
  loading = false,
  error = "",
  onClose,
  onProductClick,
}) {
  const items = order?.details || order?.items || [];

  return (
    <div className="modal-backdrop order-details-backdrop" onClick={onClose}>
      <section
        className="modal-content order-details-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h3 id="order-details-title">
              {order ? `Chi tiết đơn hàng #${order.id}` : "Chi tiết đơn hàng"}
            </h3>
            {order && <span className={`status-badge ${order.status}`}>{order.statusText}</span>}
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        {loading ? (
          <p className="empty-state">Đang tải chi tiết đơn hàng...</p>
        ) : error ? (
          <p className="order-details-error" role="alert">{error}</p>
        ) : order ? (
          <>
            <div className="order-details-info">
              <div><span>Ngày đặt</span><strong>{order.createdAt}</strong></div>
              <div><span>Người nhận</span><strong>{order.customerName}</strong></div>
              <div><span>Số điện thoại</span><strong>{order.phone}</strong></div>
              <div className="order-details-address"><span>Địa chỉ giao hàng</span><strong>{order.address}</strong></div>
              {order.note && <div className="order-details-address"><span>Ghi chú</span><strong>{order.note}</strong></div>}
            </div>

            <h4 className="order-details-section-title">Sản phẩm trong đơn</h4>
            <div className="order-details-items">
              <div className="order-details-item order-details-item-heading">
                <span>Sản phẩm</span><span>Đơn giá</span><span>SL</span><span>Thành tiền</span>
              </div>
              {items.map((item, index) => (
                <div className="order-details-item" key={`${item.productId ?? "removed"}-${index}`}>
                  {item.productId ? (
                    <button
                      type="button"
                      className="invoice-product-link"
                      onClick={() => onProductClick?.(item.productId)}
                    >
                      {item.productName}
                    </button>
                  ) : (
                    <strong>{item.productName} <small>(sản phẩm đã bị xóa)</small></strong>
                  )}
                  <span>{formatMoney(item.unitPrice ?? item.price)}</span>
                  <span>{item.quantity}</span>
                  <strong>{formatMoney(item.subTotal ?? (item.unitPrice ?? item.price) * item.quantity)}</strong>
                </div>
              ))}
            </div>

            <div className="order-details-total">
              <span>Tổng thanh toán</span>
              <strong>{formatMoney(order.totalAmount)}</strong>
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
