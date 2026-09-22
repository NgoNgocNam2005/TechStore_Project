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
  const orderSteps = [
    { status: "PENDING", label: "Đã đặt", description: "Đơn hàng đã được tiếp nhận" },
    { status: "CONFIRMED", label: "Đã xác nhận", description: "Cửa hàng đã xác nhận đơn" },
    { status: "SHIPPED", label: "Đang giao", description: "Đơn hàng đang được vận chuyển" },
    { status: "DELIVERED", label: "Đã giao", description: "Đơn hàng đã được giao" },
  ];
  const currentStepIndex = Math.max(
    0,
    orderSteps.findIndex((step) => step.status === order?.status),
  );

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
              <div>
                <span>Phương thức thanh toán</span>
                <strong>{order.paymentMethodText || "Thanh toán khi nhận hàng"}</strong>
              </div>
              <div>
                <span>Trạng thái thanh toán</span>
                <strong className={order.paymentStatus === "PAID" ? "payment-paid" : "payment-unpaid"}>
                  {order.paymentStatusText || "Chưa thanh toán"}
                </strong>
              </div>
              <div className="order-details-address"><span>Địa chỉ giao hàng</span><strong>{order.address}</strong></div>
              {order.note && <div className="order-details-address"><span>Ghi chú</span><strong>{order.note}</strong></div>}
            </div>

            <section className="order-tracking" aria-label="Tiến trình đơn hàng">
              <h4 className="order-details-section-title">Tiến trình đơn hàng</h4>
              {order.status === "CANCELLED" ? (
                <div className="order-cancelled-state" role="status">
                  <strong>Đơn hàng đã bị hủy</strong>
                  <span>{order.statusText || "Đã hủy"}</span>
                </div>
              ) : (
                <ol className="order-timeline">
                  {orderSteps.map((step, index) => {
                    const state = index < currentStepIndex
                      ? "complete"
                      : index === currentStepIndex
                        ? "current"
                        : "upcoming";
                    return (
                      <li className={`order-timeline-step ${state}`} key={step.status}>
                        <span className="order-timeline-marker" aria-hidden="true">
                          {state === "complete" ? "✓" : index + 1}
                        </span>
                        <div className="order-timeline-copy">
                          <strong>{step.label}</strong>
                          <span>{step.description}</span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>

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
