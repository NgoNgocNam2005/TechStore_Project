import { useEffect, useState } from "react";

const emptyAddress = {
  label: "Nhà riêng",
  recipientName: "",
  phone: "",
  addressLine: "",
  ward: "",
  district: "",
  province: "",
  isDefault: false
};

export default function AccountPanel({ currentUser, token, authHeaders, onUserUpdated, onClose, onToast, onSessionExpired }) {
  const [profile, setProfile] = useState({ fullName: currentUser.fullName || "", phone: currentUser.phone || "", email: currentUser.email || "" });
  const [password, setPassword] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [addresses, setAddresses] = useState([]);
  const [address, setAddress] = useState(emptyAddress);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const request = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { ...authHeaders(Boolean(options.body)), ...(options.headers || {}) }
    });
    const result = await response.json().catch(() => ({}));
    if (response.status === 401) {
      onSessionExpired();
      throw new Error("Phiên đăng nhập đã hết hạn");
    }
    if (!response.ok) throw new Error(result.message || "Thao tác thất bại");
    return result;
  };

  const loadAddresses = async () => {
    const result = await request("/api/users/me/addresses");
    setAddresses(result.data || []);
  };

  useEffect(() => {
    if (!token) return;
    void loadAddresses().catch(error => onToast(error.message, "error"));
  }, [token]);

  const updateField = (setter, field) => event => {
    setter(previous => ({ ...previous, [field]: event.target.value }));
  };

  const handleProfileSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await request("/api/users/me", { method: "PATCH", body: JSON.stringify(profile) });
      onUserUpdated(result.data);
      onToast("Đã cập nhật hồ sơ");
    } catch (error) {
      onToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      await request("/api/users/me/password", { method: "PATCH", body: JSON.stringify(password) });
      setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onToast("Đổi mật khẩu thành công");
    } catch (error) {
      onToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async event => {
    event.preventDefault();
    setLoading(true);
    try {
      await request("/api/users/me/addresses", { method: "POST", body: JSON.stringify(address) });
      setAddress(emptyAddress);
      setShowAddressForm(false);
      await loadAddresses();
      onToast("Đã thêm địa chỉ");
    } catch (error) {
      onToast(error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const makeDefault = async selectedAddress => {
    try {
      await request(`/api/users/me/addresses/${selectedAddress.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...selectedAddress, isDefault: true })
      });
      await loadAddresses();
      onToast("Đã chọn địa chỉ mặc định");
    } catch (error) {
      onToast(error.message, "error");
    }
  };

  const deleteAddress = async id => {
    if (!window.confirm("Bạn có chắc muốn xóa địa chỉ này?")) return;
    try {
      await request(`/api/users/me/addresses/${id}`, { method: "DELETE" });
      await loadAddresses();
      onToast("Đã xóa địa chỉ");
    } catch (error) {
      onToast(error.message, "error");
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 760 }} onClick={event => event.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 Tài khoản của tôi</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <form onSubmit={handleProfileSubmit} className="form-card">
            <h3>Thông tin cá nhân</h3>
            <label>Username<input value={currentUser.username} disabled /></label>
            <label>Họ và tên<input value={profile.fullName} onChange={updateField(setProfile, "fullName")} required /></label>
            <label>Số điện thoại<input value={profile.phone} onChange={updateField(setProfile, "phone")} /></label>
            <label>Email<input type="email" value={profile.email} onChange={updateField(setProfile, "email")} /></label>
            <button className="btn-primary" disabled={loading}>Lưu hồ sơ</button>
          </form>
          <form onSubmit={handlePasswordSubmit} className="form-card">
            <h3>Đổi mật khẩu</h3>
            <label>Mật khẩu hiện tại<input type="password" value={password.currentPassword} onChange={updateField(setPassword, "currentPassword")} required /></label>
            <label>Mật khẩu mới<input type="password" value={password.newPassword} onChange={updateField(setPassword, "newPassword")} minLength={6} required /></label>
            <label>Nhập lại mật khẩu<input type="password" value={password.confirmPassword} onChange={updateField(setPassword, "confirmPassword")} minLength={6} required /></label>
            <button className="btn-primary" disabled={loading}>Đổi mật khẩu</button>
          </form>
        </div>
        <div className="form-card" style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h3>Địa chỉ giao hàng</h3>
            <button type="button" className="btn-primary" onClick={() => setShowAddressForm(value => !value)}>{showAddressForm ? "Đóng form" : "+ Thêm địa chỉ"}</button>
          </div>
          {showAddressForm && (
            <form onSubmit={handleAddressSubmit} style={{ marginTop: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>Tên địa chỉ<input value={address.label} onChange={updateField(setAddress, "label")} /></label>
                <label>Người nhận<input value={address.recipientName} onChange={updateField(setAddress, "recipientName")} required /></label>
                <label>Số điện thoại<input value={address.phone} onChange={updateField(setAddress, "phone")} required /></label>
                <label>Tỉnh/Thành phố<input value={address.province} onChange={updateField(setAddress, "province")} /></label>
                <label>Quận/Huyện<input value={address.district} onChange={updateField(setAddress, "district")} /></label>
                <label>Phường/Xã<input value={address.ward} onChange={updateField(setAddress, "ward")} /></label>
              </div>
              <label>Địa chỉ chi tiết<input value={address.addressLine} onChange={updateField(setAddress, "addressLine")} required /></label>
              <label style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 8 }}><input type="checkbox" checked={address.isDefault} onChange={event => setAddress(previous => ({ ...previous, isDefault: event.target.checked }))} />Đặt làm địa chỉ mặc định</label>
              <button className="btn-primary" disabled={loading}>Lưu địa chỉ</button>
            </form>
          )}
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {addresses.length === 0 && <p className="empty-state">Bạn chưa có địa chỉ giao hàng.</p>}
            {addresses.map(item => (
              <div key={item.id} style={{ border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><strong>{item.label} {item.isDefault && <span style={{ color: "#34d399" }}>• Mặc định</span>}</strong><div style={{ display: "flex", gap: 8 }}>{!item.isDefault && <button className="role-btn" onClick={() => makeDefault(item)}>Đặt mặc định</button>}<button className="role-btn" onClick={() => deleteAddress(item.id)} style={{ color: "#f87171" }}>Xóa</button></div></div>
                <div style={{ color: "var(--text-muted)", marginTop: 5 }}>{item.recipientName} · {item.phone}</div>
                <div style={{ color: "var(--text-muted)" }}>{[item.addressLine, item.ward, item.district, item.province].filter(Boolean).join(", ")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
