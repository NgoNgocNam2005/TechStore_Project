import { userRepository } from "../repository/userRepository.js";
import { UserMapper } from "../mapper/userMapper.js";
import { Role } from "../enums/Role.js";
import { AppError } from "../exception/AppError.js";
import bcrypt from "bcryptjs";
import { addressRepository } from "../repository/addressRepository.js";
import { AddressMapper } from "../mapper/addressMapper.js";

export const userService = {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Tài khoản không còn tồn tại", 404);
    return UserMapper.toResponseDTO(user);
  },

  async updateProfile(userId, dto) {
    dto.validate();
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Tài khoản không còn tồn tại", 404);
    return UserMapper.toResponseDTO(await userRepository.updateProfile(userId, dto));
  },

  async changePassword(userId, dto) {
    dto.validate();
    const user = await userRepository.findById(userId);
    if (!user) throw new AppError("Tài khoản không còn tồn tại", 404);
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new AppError("Mật khẩu hiện tại không chính xác", 400);
    }
    await userRepository.updatePassword(userId, await bcrypt.hash(dto.newPassword, 12));
  },

  async getAddresses(userId) {
    return AddressMapper.toListResponseDTO(await addressRepository.findByUserId(userId));
  },

  async createAddress(userId, dto) {
    dto.validate();
    return AddressMapper.toResponseDTO(await addressRepository.create(userId, dto));
  },

  async updateAddress(userId, addressId, dto) {
    dto.validate();
    const existing = await addressRepository.findByIdForUser(addressId, userId);
    if (!existing) throw new AppError("Không tìm thấy địa chỉ", 404);
    return AddressMapper.toResponseDTO(await addressRepository.update(addressId, userId, dto));
  },

  async deleteAddress(userId, addressId) {
    const deleted = await addressRepository.delete(addressId, userId);
    if (!deleted) throw new AppError("Không tìm thấy địa chỉ", 404);
  },

  async getEmployees() {
    const employees = await userRepository.findEmployees();
    return UserMapper.toListResponseDTO(employees);
  },

  async createEmployee(createDTO) {
    createDTO.validate();

    // Kiểm tra trùng username
    const all = await userRepository.findAll();
    const isDup = all.some(u => u.username.toLowerCase() === createDTO.username.toLowerCase());
    if (isDup) {
      throw new AppError(`Tên đăng nhập "${createDTO.username}" đã tồn tại trên hệ thống`, 400);
    }

    const entity = UserMapper.toEntity({
      ...createDTO,
      password: await bcrypt.hash(createDTO.password, 12)
    });
    const saved = await userRepository.create(entity);
    return UserMapper.toResponseDTO(saved);
  },

  async updateEmployee(id, updateDTO) {
    updateDTO.validate();
    const existing = await userRepository.findById(id);
    if (!existing) throw new AppError(`Không tìm thấy nhân viên có ID ${id}`, 404);

    if (updateDTO.username && updateDTO.username.toLowerCase() !== existing.username.toLowerCase()) {
      const duplicate = await userRepository.findByUsername(updateDTO.username);
      if (duplicate) throw new AppError(`Tên đăng nhập "${updateDTO.username}" đã tồn tại`, 400);
    }

    const fields = { ...updateDTO };
    if (updateDTO.password !== undefined) {
      fields.password = await bcrypt.hash(updateDTO.password, 12);
    }
    const updated = await userRepository.update(id, fields);
    return UserMapper.toResponseDTO(updated);
  },

  async deleteEmployee(id, actorId) {
    const user = await userRepository.findById(id);
    if (!user) throw new AppError(`Không tìm thấy nhân viên có ID ${id}`, 404);
    if (Number(id) === Number(actorId)) {
      throw new AppError("Không thể tự xóa tài khoản đang đăng nhập", 400);
    }
    if (user.role === Role.ADMIN) {
      throw new AppError("Không thể xóa tài khoản Quản trị viên cấp cao (ADMIN)!", 403);
    }

    await userRepository.delete(id);
    return { id, message: `Đã xóa tài khoản nhân sự "${user.fullName}" thành công` };
  }
};
