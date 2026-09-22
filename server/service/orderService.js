import { orderRepository } from "../repository/orderRepository.js";
import { OrderMapper } from "../mapper/orderMapper.js";
import { OrderStatus } from "../enums/OrderStatus.js";
import { AppError } from "../exception/AppError.js";

const staffRoles = new Set(["ADMIN", "MANAGER", "SALER", "SHIPPER"]);
const fullOrderManagementRoles = new Set(["ADMIN", "MANAGER"]);

const allowedTransitions = {
  PENDING: new Set([OrderStatus.CONFIRMED, OrderStatus.CANCELLED]),
  CONFIRMED: new Set([OrderStatus.SHIPPED]),
  SHIPPED: new Set([OrderStatus.DELIVERED]),
  DELIVERED: new Set(),
  CANCELLED: new Set()
};

export const orderService = {
  async create(createDTO, userId) {
    createDTO.validate();
    if (!userId) throw new AppError("Không xác định được người đặt hàng", 401);

    createDTO.userId = userId;
    const orderEntity = OrderMapper.toEntity(createDTO, [], 0);
    const savedOrder = await orderRepository.createWithTransaction({
      orderEntity,
      requestedItems: createDTO.items
    });

    return OrderMapper.toResponseDTO(savedOrder);
  },

  async getAll() {
    const orders = await orderRepository.findAll();
    return OrderMapper.toListResponseDTO(orders);
  },

  async getMine(userId) {
    const orders = await orderRepository.findByUserId(userId);
    return OrderMapper.toListResponseDTO(orders);
  },

  async getById(id, requester) {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError(`Không tìm thấy đơn hàng #${id}`, 404);
    if (Number(order.userId) !== Number(requester.id) && !staffRoles.has(requester.role)) {
      throw new AppError("Bạn không có quyền xem đơn hàng này", 403);
    }
    return OrderMapper.toResponseDTO(order);
  },

  async cancel(id, requester) {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError(`Không tìm thấy đơn hàng #${id}`, 404);
    if (Number(order.userId) !== Number(requester.id)) {
      throw new AppError("Bạn không có quyền hủy đơn hàng này", 403);
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new AppError("Chỉ có thể hủy đơn hàng đang chờ duyệt", 400);
    }

    const updated = await orderRepository.cancelPending(id, requester.id);
    return OrderMapper.toResponseDTO(updated);
  },

  async updateStatus(id, newStatus, requester) {
    if (!Object.values(OrderStatus).includes(newStatus)) {
      throw new AppError(`Trạng thái "${newStatus}" không hợp lệ`, 400);
    }

    const order = await orderRepository.findById(id);
    if (!order) throw new AppError(`Không tìm thấy đơn hàng #${id}`, 404);

    const isFullManager = fullOrderManagementRoles.has(requester?.role);
    const canSalerConfirm = requester?.role === "SALER"
      && order.status === OrderStatus.PENDING
      && newStatus === OrderStatus.CONFIRMED;
    const canShipperDeliver = requester?.role === "SHIPPER"
      && ((order.status === OrderStatus.CONFIRMED && newStatus === OrderStatus.SHIPPED)
        || (order.status === OrderStatus.SHIPPED && newStatus === OrderStatus.DELIVERED));
    const transitionAllowed = isFullManager
      ? allowedTransitions[order.status]?.has(newStatus)
      : canSalerConfirm || canShipperDeliver;

    if (order.status !== newStatus && !transitionAllowed) {
      throw new AppError(`Không thể chuyển đơn hàng từ ${order.status} sang ${newStatus}`, 400);
    }

    if (newStatus === OrderStatus.CANCELLED && order.status === OrderStatus.PENDING) {
      const cancelled = await orderRepository.cancelPending(id);
      return OrderMapper.toResponseDTO(cancelled);
    }

    const updated = await orderRepository.updateStatus(id, newStatus);
    return OrderMapper.toResponseDTO(updated);
  },

  async updatePaymentStatus(id, paymentStatus, requester) {
    if (!fullOrderManagementRoles.has(requester?.role)) {
      throw new AppError("Chi ADMIN hoac MANAGER moi duoc cap nhat trang thai thanh toan", 403);
    }
    if (!["UNPAID", "PAID"].includes(paymentStatus)) {
      throw new AppError("Trang thai thanh toan khong hop le", 400);
    }

    const order = await orderRepository.findById(id);
    if (!order) throw new AppError(`Khong tim thay don hang #${id}`, 404);
    if (order.status === OrderStatus.CANCELLED && paymentStatus === "PAID") {
      throw new AppError("Khong the danh dau da thanh toan cho don da huy", 400);
    }

    const updated = await orderRepository.updatePaymentStatus(id, paymentStatus);
    return OrderMapper.toResponseDTO(updated);
  }
};
