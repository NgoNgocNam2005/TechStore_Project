import { orderService } from "../service/orderService.js";
import { CreateOrderDTO } from "../dto/request/orderDTO.js";

export const orderController = {
  async createOrder(req, res, next) {
    try {
      const dto = new CreateOrderDTO(req.body);
      const data = await orderService.create(dto, req.user.id);
      res.status(201).json({
        success: true,
        message: "Đặt mua điện thoại thành công!",
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async getOrders(req, res, next) {
    try {
      const data = await orderService.getAll();
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  async getMyOrders(req, res, next) {
    try {
      const data = await orderService.getMine(req.user.id);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  async getOrderById(req, res, next) {
    try {
      const data = await orderService.getById(req.params.id, req.user);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async cancelOrder(req, res, next) {
    try {
      const data = await orderService.cancel(req.params.id, req.user);
      res.json({ success: true, message: "Đã hủy đơn hàng", data });
    } catch (err) {
      next(err);
    }
  },

  async updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;
      const data = await orderService.updateStatus(req.params.id, status, req.user);
      res.json({
        success: true,
        message: `Đã cập nhật đơn hàng sang trạng thái "${data.statusText}"`,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async updatePaymentStatus(req, res, next) {
    try {
      const data = await orderService.updatePaymentStatus(
        req.params.id,
        req.body?.paymentStatus,
        req.user
      );
      res.json({
        success: true,
        message: "Cap nhat trang thai thanh toan thanh cong",
        data
      });
    } catch (err) {
      next(err);
    }
  }
};
