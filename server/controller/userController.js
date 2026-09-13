import { userService } from "../service/userService.js";
import { CreateEmployeeDTO, UpdateEmployeeDTO } from "../dto/request/userDTO.js";
import {
  UpdateProfileDTO,
  ChangePasswordDTO,
  CreateAddressDTO,
  UpdateAddressDTO
} from "../dto/request/profileDTO.js";

export const userController = {
  async getProfile(req, res, next) {
    try {
      const data = await userService.getProfile(req.user.id);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const data = await userService.updateProfile(req.user.id, new UpdateProfileDTO(req.body));
      res.json({ success: true, message: "Cập nhật hồ sơ thành công", data });
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req, res, next) {
    try {
      await userService.changePassword(req.user.id, new ChangePasswordDTO(req.body));
      res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (err) {
      next(err);
    }
  },

  async getAddresses(req, res, next) {
    try {
      const data = await userService.getAddresses(req.user.id);
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  async createAddress(req, res, next) {
    try {
      const data = await userService.createAddress(req.user.id, new CreateAddressDTO(req.body));
      res.status(201).json({ success: true, message: "Thêm địa chỉ thành công", data });
    } catch (err) {
      next(err);
    }
  },

  async updateAddress(req, res, next) {
    try {
      const data = await userService.updateAddress(
        req.user.id,
        req.params.addressId,
        new UpdateAddressDTO(req.body)
      );
      res.json({ success: true, message: "Cập nhật địa chỉ thành công", data });
    } catch (err) {
      next(err);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      await userService.deleteAddress(req.user.id, req.params.addressId);
      res.json({ success: true, message: "Đã xóa địa chỉ" });
    } catch (err) {
      next(err);
    }
  },

  async getEmployees(req, res, next) {
    try {
      const data = await userService.getEmployees();
      res.json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  },

  async createEmployee(req, res, next) {
    try {
      const dto = new CreateEmployeeDTO(req.body);
      const data = await userService.createEmployee(dto);
      res.status(201).json({
        success: true,
        message: `Đã tạo tài khoản nhân sự cho "${data.fullName}" thành công!`,
        data
      });
    } catch (err) {
      next(err);
    }
  },

  async updateEmployee(req, res, next) {
    try {
      const dto = new UpdateEmployeeDTO(req.body);
      const data = await userService.updateEmployee(req.params.id, dto);
      res.json({ success: true, message: "Cập nhật tài khoản nhân sự thành công", data });
    } catch (err) {
      next(err);
    }
  },

  async deleteEmployee(req, res, next) {
    try {
      const result = await userService.deleteEmployee(req.params.id, req.user.id);
      res.json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
};
