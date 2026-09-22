import { Order } from "../entity/Order.js";
import { OrderResponseDTO } from "../dto/response/orderResponseDTO.js";

export const OrderMapper = {
  toEntity(dto, processedItems, totalAmount) {
    return new Order({
      userId: dto.userId,
      customerName: dto.customerName,
      phone: dto.phone,
      address: dto.address,
      items: processedItems,
      totalAmount: totalAmount,
      paymentMethod: dto.paymentMethod,
      paymentStatus: "UNPAID",
      note: dto.note
    });
  },

  toResponseDTO(entity) {
    if (!entity) return null;
    return new OrderResponseDTO(entity);
  },

  toListResponseDTO(entities) {
    if (!Array.isArray(entities)) return [];
    return entities.map(e => new OrderResponseDTO(e));
  }
};
