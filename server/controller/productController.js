import { productService } from "../service/productService.js";
import { CreateProductDTO, UpdateProductDTO } from "../dto/request/productDTO.js";

export const productController = {
  async getProducts(req, res, next) {
    try {
      const { brand, search, minPrice, maxPrice, page, pageSize } = req.query;
      const result = await productService.getAll({ brand, search, minPrice, maxPrice, page, pageSize });
      res.json({
        success: true,
        count: result.products.length,
        total: result.total,
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          totalPages: Math.ceil(result.total / result.pageSize)
        },
        data: result.products
      });
    } catch (err) {
      next(err);
    }
  },

  async getProductById(req, res, next) {
    try {
      const data = await productService.getById(req.params.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async createProduct(req, res, next) {
    try {
      const dto = new CreateProductDTO(req.body);
      const data = await productService.create(dto);
      res.status(201).json({
        success: true,
        message: "Thêm điện thoại mới vào hệ thống thành công!",
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async updateProduct(req, res, next) {
    try {
      const dto = new UpdateProductDTO(req.body);
      const data = await productService.update(req.params.id, dto);
      res.json({
        success: true,
        message: "Cập nhật thông tin điện thoại thành công!",
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteProduct(req, res, next) {
    try {
      const result = await productService.delete(req.params.id);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
};
