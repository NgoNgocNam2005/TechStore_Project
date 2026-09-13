import { Product } from "../entity/Product.js";
import { ProductResponseDTO } from "../dto/response/productResponseDTO.js";

export const ProductMapper = {
  toEntity(dto) {
    return new Product({
      name: dto.name,
      brand: dto.brand,
      price: dto.price,
      stock: dto.stock,
      specs: dto.specs,
      imageUrl: dto.imageUrl
    });
  },

  toResponseDTO(entity) {
    if (!entity) return null;
    return new ProductResponseDTO(entity);
  },

  toListResponseDTO(entities) {
    if (!Array.isArray(entities)) return [];
    return entities.map(e => new ProductResponseDTO(e));
  }
};