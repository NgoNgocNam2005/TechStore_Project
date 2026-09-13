import { Address } from "../entity/Address.js";
import { AddressResponseDTO } from "../dto/response/addressResponseDTO.js";

export const AddressMapper = {
  toEntity(dto, userId) {
    return new Address({ ...dto, userId });
  },

  toResponseDTO(entity) {
    return entity ? new AddressResponseDTO(entity) : null;
  },

  toListResponseDTO(entities) {
    return Array.isArray(entities) ? entities.map(entity => new AddressResponseDTO(entity)) : [];
  }
};
