import { WishlistResponseDTO } from "../dto/response/wishlistResponseDTO.js";

export const wishlistMapper = {
  toResponseDTO(entity) {
    return entity ? new WishlistResponseDTO(entity) : null;
  },

  toListResponseDTO(entities) {
    return entities.map(entity => new WishlistResponseDTO(entity));
  }
};
