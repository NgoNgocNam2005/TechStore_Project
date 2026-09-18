import { invoiceService } from "../service/invoiceService.js";

export const invoiceController = {
  async getMine(req, res, next) {
    try {
      const data = await invoiceService.getMine(req.user.id);
      return res.status(200).json({ success: true, count: data.length, data });
    } catch (error) {
      return next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await invoiceService.getById(req.params.invoiceId, req.user);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  },
};
