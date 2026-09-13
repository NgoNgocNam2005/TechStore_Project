import { User } from "../entity/User.js";
import { UserResponseDTO } from "../dto/response/userResponseDTO.js";

export const UserMapper = {
  toEntity(dto) {
    return new User({
      username: dto.username,
      password: dto.password,
      fullName: dto.fullName,
      role: dto.role,
      phone: dto.phone,
      email: dto.email
    });
  },

  toResponseDTO(entity) {
    if (!entity) return null;
    return new UserResponseDTO(entity);
  },

  toListResponseDTO(entities) {
    if (!Array.isArray(entities)) return [];
    return entities.map(e => new UserResponseDTO(e));
  }
};