export class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.username = user.username;
    this.fullName = user.fullName;
    this.role = user.role;
    this.roleTitle = this._getRoleTitle(user.role);
    this.phone = user.phone;
    this.email = user.email;
    this.createdAt = new Date(user.createdAt).toLocaleDateString("vi-VN");
    // LƯU Ý BẢO MẬT: Mật khẩu user.password được giấu hoàn toàn tại đây!
  }

  _getRoleTitle(role) {
    switch (role) {
      case "ADMIN": return "Quản trị viên cấp cao";
      case "MANAGER": return "Trưởng phòng quản lý";
      case "SALER": return "Nhân viên bán hàng";
      case "CUSTOMER": return "Khách mua hàng";
      default: return role;
    }
  }
}