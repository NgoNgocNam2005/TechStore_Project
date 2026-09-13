import { productRepository } from "../repository/productRepository.js";
import { ProductMapper } from "../mapper/productMapper.js";
import { AppError } from "../exception/AppError.js";

export const productService = {
  async getAll(filters = {}) {
    const result = await productRepository.findByFilters(filters);
    return {
      ...result,
      products: ProductMapper.toListResponseDTO(result.products)
    };
  },

  async getById(id) {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError(`Không tìm thấy điện thoại có ID ${id}`, 404);
    return ProductMapper.toResponseDTO(product);
  },

  async create(createDTO) {
    createDTO.validate();
    const entity = ProductMapper.toEntity(createDTO);
    const saved = await productRepository.create(entity);
    return ProductMapper.toResponseDTO(saved);
  },

  async update(id, updateDTO) {
    updateDTO.validate();
    const existing = await productRepository.findById(id);
    if (!existing) throw new AppError(`Không tìm thấy điện thoại có ID ${id} để cập nhật`, 404);

    const updated = await productRepository.update(id, updateDTO);
    return ProductMapper.toResponseDTO(updated);
  },

  async delete(id) {
    const existing = await productRepository.findById(id);
    if (!existing) throw new AppError(`Không tìm thấy điện thoại có ID ${id} để xóa`, 404);

    await productRepository.delete(id);
    return { id, message: `Đã xóa điện thoại "${existing.name}" thành công` };
  }
};
