import { orderRepository } from "../repository/orderRepository.js";
import { OrderMapper } from "../mapper/orderMapper.js";
import { OrderStatus } from "../enums/OrderStatus.js";
import { AppError } from "../exception/AppError.js";

const staffRoles = new Set(["ADMIN", "MANAGER", "SALER"]);

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
    if (order.userId !== requester.id && !staffRoles.has(requester.role)) {
      throw new AppError("Bạn không có quyền xem đơn hàng này", 403);
    }
    return OrderMapper.toResponseDTO(order);
  },

  async cancel(id, requester) {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError(`Không tìm thấy đơn hàng #${id}`, 404);
    if (order.userId !== requester.id) {
      throw new AppError("Bạn không có quyền hủy đơn hàng này", 403);
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new AppError("Chỉ có thể hủy đơn hàng đang chờ duyệt", 400);
    }

    const updated = await orderRepository.cancelPending(id, requester.id);
    return OrderMapper.toResponseDTO(updated);
  },

  async updateStatus(id, newStatus) {
    if (!Object.values(OrderStatus).includes(newStatus)) {
      throw new AppError(`Trạng thái "${newStatus}" không hợp lệ`, 400);
    }

    const order = await orderRepository.findById(id);
    if (!order) throw new AppError(`Không tìm thấy đơn hàng #${id}`, 404);

    if (order.status !== newStatus && !allowedTransitions[order.status]?.has(newStatus)) {
      throw new AppError(`Không thể chuyển đơn hàng từ ${order.status} sang ${newStatus}`, 400);
    }

    if (newStatus === OrderStatus.CANCELLED && order.status === OrderStatus.PENDING) {
      const cancelled = await orderRepository.cancelPending(id);
      return OrderMapper.toResponseDTO(cancelled);
    }

    const updated = await orderRepository.updateStatus(id, newStatus);
    return OrderMapper.toResponseDTO(updated);
  }
};
