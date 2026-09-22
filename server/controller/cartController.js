import { cartService } from "../service/cartService.js";

export const cartController = {
  async getMine(req, res, next) {
    try {
      const data = await cartService.getMine(req.user.id);
      res.json({ success: true, count: data.length, data });
    } catch (error) {
      next(error);
    }
  },

  async replaceMine(req, res, next) {
    try {
      const data = await cartService.replaceMine(req.user.id, req.body?.items);
      res.json({ success: true, count: data.length, data });
    } catch (error) {
      next(error);
    }
  },
};
