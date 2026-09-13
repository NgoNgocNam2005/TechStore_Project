import { useState, useEffect, useCallback } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage.jsx";
import AccountPanel from "./pages/AccountPanel.jsx";

function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("techstore_user") || "null");
    } catch {
      return null;
    }
  }); // { id, username, fullName, role, roleTitle, ... }
  const [token, setToken] = useState(null);
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("techstore_cart") || "[]");
    } catch {
      return [];
    }
  });

  // Phân quyền dựa trên user đang đăng nhập
  const activeRole = currentUser
    ? ["ADMIN", "MANAGER", "SALER"].includes(currentUser.role)
      ? "ADMIN"
      : "CUSTOMER"
    : "CUSTOMER";
  const canManageStaff = currentUser?.role === "ADMIN";
  const currentRole = currentUser?.role;

  const handleLoginSuccess = (jwt, user) => {
    setToken(jwt);
    setCurrentUser(user);
    setCart([]);
    localStorage.setItem("techstore_user", JSON.stringify(user));
    localStorage.removeItem("techstore_cart");
  };

  const clearSession = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem("techstore_token");
    localStorage.removeItem("techstore_user");
    localStorage.removeItem("techstore_cart");
  }, []);

  const authHeaders = useCallback((json = false) => ({
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include"
      });
      if (!response.ok) return false;
      const result = await response.json();
      setToken(result.token);
      setCurrentUser(result.user);
      localStorage.setItem("techstore_user", JSON.stringify(result.user));
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      clearSession();
    }
  };

  const handleUserUpdated = (user) => {
    setCurrentUser(user);
    localStorage.setItem("techstore_user", JSON.stringify(user));
  };

  // Dữ liệu từ Server
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [serverOnline, setServerOnline] = useState(false);

  // Bộ lọc Khách hàng
  const [selectedBrand, setSelectedBrand] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Giỏ hàng và checkout (Customer)
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    note: ""
  });

  // Tab của Admin
  const [adminTab, setAdminTab] = useState("PRODUCTS"); // PRODUCTS | ORDERS | STAFF

  // Form thêm sản phẩm (Admin)
  const [newProduct, setNewProduct] = useState({
    name: "",
    brand: "Apple",
    price: "",
    stock: "",
    ram: "8GB",
    storage: "256GB",
    color: "Titan Đen",
    imageUrl: ""
  });
  const [editingProductId, setEditingProductId] = useState(null);

  // Form thêm nhân sự (Admin)
  const [newStaff, setNewStaff] = useState({
    username: "",
    password: "",
    fullName: "",
    role: "SALER",
    phone: "",
    email: ""
  });
  const [editingStaffId, setEditingStaffId] = useState(null);

  // Thông báo Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  useEffect(() => {
    localStorage.setItem("techstore_cart", JSON.stringify(cart));
  }, [cart]);

  const handleAddToCart = (product) => {
    const existing = cart.find(item => item.productId === product.id);
    if (existing && existing.quantity >= product.stock) {
      showToast(`Sản phẩm "${product.name}" đã đạt số lượng tồn kho`, "error");
      return;
    }

    if (existing) {
      setCart(cart.map(item => item.productId === product.id
        ? { ...item, quantity: item.quantity + 1, stock: product.stock }
        : item));
    } else {
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        formattedPrice: product.formattedPrice,
        imageUrl: product.imageUrl,
        stock: product.stock,
        quantity: 1
      }]);
    }
    showToast(`Đã thêm "${product.name}" vào giỏ hàng`);
  };

  const updateCartQuantity = (productId, quantity) => {
    setCart(currentCart => currentCart
      .map(item => item.productId === productId
        ? { ...item, quantity: Math.min(item.stock, Math.max(1, Number(quantity) || 1)) }
        : item));
  };

  const removeFromCart = (productId) => {
    setCart(currentCart => currentCart.filter(item => item.productId !== productId));
  };

  const openCheckout = () => {
    if (cart.length === 0) {
      showToast("Giỏ hàng đang trống", "error");
      return;
    }
    setOrderForm(form => ({
      ...form,
      customerName: form.customerName || currentUser.fullName || "",
      phone: form.phone || currentUser.phone || ""
    }));
    setCheckoutOpen(true);
  };

  const buyNow = (product) => {
    setCart([{
      productId: product.id,
      name: product.name,
      price: product.price,
      formattedPrice: product.formattedPrice,
      imageUrl: product.imageUrl,
      stock: product.stock,
      quantity: 1
    }]);
    setOrderForm(form => ({
      ...form,
      customerName: form.customerName || currentUser.fullName || "",
      phone: form.phone || currentUser.phone || ""
    }));
    setCheckoutOpen(true);
  };

  // 1. Tải dữ liệu từ Backend
  const loadData = useCallback(async () => {
    try {
      // Healthcheck
      const statusRes = await fetch("/api/status");
      if (statusRes.ok) setServerOnline(true);

      // Sản phẩm
      const prodRes = await fetch("/api/products");
      if (prodRes.ok) {
        const json = await prodRes.json();
        setProducts(json.data || []);
      }

      // Đơn hàng
      const orderPath = activeRole === "CUSTOMER" ? "/api/orders/my" : "/api/orders";
      const orderRes = await fetch(orderPath, { headers: authHeaders() });
      if (orderRes.status === 401) {
        if (await refreshSession()) return;
        clearSession();
        return;
      }
      if (orderRes.ok) {
        const json = await orderRes.json();
        setOrders(json.data || []);
      }

      if (activeRole === "CUSTOMER") {
        const wishlistRes = await fetch("/api/users/me/wishlist", {
          headers: authHeaders()
        });

        if (wishlistRes.ok) {
          const json = await wishlistRes.json();
          setWishlist(json.data || []);
        }
      } else {
        setWishlist([]);
      }

      // Chỉ ADMIN được quản lý nhân sự và gọi endpoint này.
      if (currentRole === "ADMIN") {
        const userRes = await fetch("/api/users/employees", { headers: authHeaders() });
        if (userRes.ok) {
          const json = await userRes.json();
          setEmployees(json.data || []);
        }
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Lỗi tải dữ liệu:", err);
      setServerOnline(false);
    }
  }, [activeRole, authHeaders, clearSession, currentRole, refreshSession]);

  const handleToggleWishlist = async (product) => {
    const savedItem = wishlist.find(
      item => Number(item.productId) === Number(product.id)
    );

    try {
      const response = await fetch(
        `/api/users/me/wishlist/${product.id}`,
        {
          method: savedItem ? "DELETE" : "POST",
          headers: authHeaders()
        }
      );

      if (response.status === 401) {
        if (await refreshSession()) {
          showToast("Phiên đăng nhập đã được làm mới, hãy thử lại", "error");
          return;
        }
        clearSession();
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Không thể cập nhật yêu thích");
      }

      if (savedItem) {
        setWishlist(items => items.filter(
          item => Number(item.productId) !== Number(product.id)
        ));
        showToast("Đã xóa khỏi danh sách yêu thích");
      } else {
        setWishlist(items => [...items, result.data]);
        showToast("Đã thêm vào danh sách yêu thích");
      }
    } catch (error) {
      showToast(error.message, "error");
    }
  };

  useEffect(() => {
    if (token) return undefined;
    const timer = window.setTimeout(async () => {
      const refreshed = await refreshSession();
      if (!refreshed) clearSession();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [clearSession, refreshSession, token]);

  useEffect(() => {
    if (!token || !currentUser) return undefined;
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentUser, loadData, token]);

  // 2. Khách hàng: Gửi đơn đặt mua
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      const payload = {
        customerName: orderForm.customerName,
        phone: orderForm.phone,
        address: orderForm.address,
        note: orderForm.note,
        items: cart.map(item => ({ productId: item.productId, quantity: item.quantity }))
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Đặt hàng thất bại");

      showToast("🎉 Đặt hàng thành công!");
      setCart([]);
      setCheckoutOpen(false);
      setOrderForm({ customerName: "", phone: "", address: "", note: "" });

      // Cập nhật lại kho và danh sách đơn
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. Admin: Thêm điện thoại mới
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newProduct.name,
        brand: newProduct.brand,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock),
        specs: {
          ram: newProduct.ram,
          storage: newProduct.storage,
          color: newProduct.color
        },
        imageUrl: newProduct.imageUrl || undefined
      };

      const res = await fetch(editingProductId ? `/api/products/${editingProductId}` : "/api/products", {
        method: editingProductId ? "PUT" : "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      showToast(editingProductId
        ? `Đã cập nhật máy "${result.data.name}"`
        : `Đã thêm máy "${result.data.name}" vào kho hàng`);
      setEditingProductId(null);
      setNewProduct({
        name: "",
        brand: "Apple",
        price: "",
        stock: "",
        ram: "8GB",
        storage: "256GB",
        color: "Titan Đen",
        imageUrl: ""
      });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditProduct = (product) => {
    setEditingProductId(product.id);
    setNewProduct({
      name: product.name,
      brand: product.brand,
      price: product.price,
      stock: product.stock,
      ram: product.specs?.ram || "",
      storage: product.specs?.storage || "",
      color: product.specs?.color || "",
      imageUrl: product.imageUrl || ""
    });
    setAdminTab("PRODUCTS");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
    setNewProduct({
      name: "", brand: "Apple", price: "", stock: "", ram: "8GB",
      storage: "256GB", color: "Titan Đen", imageUrl: ""
    });
  };

  // 4. Admin: Xóa điện thoại
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE", headers: authHeaders() });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      showToast(`Đã xóa "${name}"`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 5. Admin / Saler: Đổi trạng thái đơn hàng
  const handleUpdateOrderStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify({ status })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      showToast(result.message);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancelOrder = async (id) => {
    if (!window.confirm(`Bạn có chắc muốn hủy đơn hàng #${id}?`)) return;
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "PATCH",
        headers: authHeaders()
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể hủy đơn hàng");
      showToast(result.message);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 6. Admin: Thêm nhân viên mới
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(editingStaffId ? `/api/users/employees/${editingStaffId}` : "/api/users/employees", {
        method: editingStaffId ? "PUT" : "POST",
        headers: authHeaders(true),
        body: JSON.stringify(newStaff)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);

      showToast(result.message);
      setEditingStaffId(null);
      setNewStaff({ username: "", password: "", fullName: "", role: "SALER", phone: "", email: "" });
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const startEditStaff = (staff) => {
    setEditingStaffId(staff.id);
    setNewStaff({
      username: staff.username,
      password: "",
      fullName: staff.fullName,
      role: staff.role,
      phone: staff.phone || "",
      email: staff.email || ""
    });
    setAdminTab("STAFF");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteStaff = async (staff) => {
    if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${staff.username}"?`)) return;
    try {
      const res = await fetch(`/api/users/employees/${staff.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể xóa nhân viên");
      showToast(result.message);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Lọc sản phẩm cho khách
  const filteredProducts = products.filter(p => {
    const matchBrand = selectedBrand === "ALL" || p.brand.toLowerCase() === selectedBrand.toLowerCase();
    const normalizedSearch = searchQuery.toLowerCase();
    const matchSearch = !searchQuery
      || p.name.toLowerCase().includes(normalizedSearch)
      || p.brand.toLowerCase().includes(normalizedSearch);
    return matchBrand && matchSearch;
  });
  const brandOptions = ["ALL", ...new Set(products.map(product => product.brand))];
  const wishlistProductIds = new Set(
    wishlist.map(item => Number(item.productId))
  );

  // Chưa đăng nhập → hiện trang Login
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="techstore-app">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: toast.type === "error" ? "#ef4444" : "#10b981",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: 12,
          fontWeight: 600,
          boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
          zIndex: 2000,
          animation: "modal-pop 0.2s"
        }}>
          {toast.msg}
        </div>
      )}

      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="brand-section">
          <div className="brand-icon">📱</div>
          <div className="brand-text">
            <h1>TechStore Hub</h1>
            <p>Hệ thống Bán Điện Thoại & Quản Lý Doanh Nghiệp</p>
          </div>
        </div>

        <div className="nav-controls">
          <div className="server-pill">
            <div className="server-dot"></div>
            <span>{serverOnline ? "Backend Clean Architecture Online" : "Server Disconnected"}</span>
          </div>

          {/* User Info + Logout */}
          <div className="role-switcher">
            {activeRole === "CUSTOMER" && (
              <button
                id="btn-wishlist"
                className={`role-btn ${wishlistOpen ? "active" : ""}`}
                onClick={() => setWishlistOpen(value => !value)}
              >
                ♥ Yêu thích ({wishlist.length})
              </button>
            )}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 14px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)"
            }}>
              <span style={{ fontSize: "1.1rem" }}>
                {activeRole === "ADMIN" ? "👑" : "🛒"}
              </span>
              <div style={{ lineHeight: 1.3 }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>
                  {currentUser.fullName}
                </div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)" }}>
                  {currentUser.roleTitle}
                </div>
              </div>
            </div>
            <button
              id="btn-account"
              className="role-btn"
              onClick={() => setAccountOpen(true)}
            >
              👤 Tài khoản
            </button>
            <button
              id="btn-logout"
              className="role-btn"
              onClick={handleLogout}
              style={{ color: "#f87171", borderColor: "rgba(248,113,113,0.3)" }}
            >
              🚪 Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      {accountOpen && (
        <AccountPanel
          currentUser={currentUser}
          token={token}
          authHeaders={authHeaders}
          onUserUpdated={handleUserUpdated}
          onClose={() => setAccountOpen(false)}
          onToast={showToast}
          onSessionExpired={clearSession}
        />
      )}

      {/* VIEW: KHÁCH HÀNG (CUSTOMER) */}
      {activeRole === "CUSTOMER" && (
        <div>
          <div className="view-header">
            <h2>Khám phá Điện thoại Thông minh Chính hãng</h2>
            <p>Chọn máy ưng ý và đặt hàng nhanh chóng trực tiếp đến tận nhà bạn</p>
          </div>

          {/* Filter Bar */}
          <div className="filter-bar">
            <div className="brand-tabs">
              {brandOptions.map(b => (
                <button
                  key={b}
                  className={`brand-tab-btn ${selectedBrand === b ? "active" : ""}`}
                  onClick={() => setSelectedBrand(b)}
                >
                  {b === "ALL" ? "Tất cả thương hiệu" : b}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="search-input"
              placeholder="🔍 Tìm kiếm mẫu điện thoại..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Product Grid */}
          <div className="product-grid">
            {filteredProducts.map(phone => (
              <div key={phone.id} className="phone-card">
                <div className="phone-image-wrapper">
                  <span className="brand-pill">{phone.brand}</span>
                  <button
                    type="button"
                    className={`wishlist-button ${wishlistProductIds.has(Number(phone.id)) ? "active" : ""}`}
                    aria-label={wishlistProductIds.has(Number(phone.id)) ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
                    onClick={() => handleToggleWishlist(phone)}
                  >
                    {wishlistProductIds.has(Number(phone.id)) ? "♥" : "♡"}
                  </button>
                  <img src={phone.imageUrl} alt={phone.name} />
                </div>
                <div className="phone-content">
                  <h3 className="phone-title">{phone.name}</h3>

                  <div className="specs-tags">
                    <span className="spec-badge">RAM {phone.specs?.ram}</span>
                    <span className="spec-badge">Bộ nhớ {phone.specs?.storage}</span>
                    <span className="spec-badge">{phone.specs?.color}</span>
                  </div>

                  <div className="phone-footer">
                    <div>
                      <div className="phone-price">{phone.formattedPrice}</div>
                      <div className={`stock-info ${phone.isAvailable ? "in-stock" : "out-of-stock"}`}>
                        {phone.isAvailable ? `• Còn ${phone.stock} máy` : "• Hết hàng"}
                      </div>
                    </div>

                    <button
                      className="btn-buy"
                      disabled={!phone.isAvailable}
                      onClick={() => handleAddToCart(phone)}
                    >
                      {phone.isAvailable ? "Thêm giỏ" : "Tạm hết"}
                    </button>
                    {phone.isAvailable && (
                      <button
                        className="btn-buy btn-buy-secondary"
                        onClick={() => buyNow(phone)}
                      >
                        Mua ngay
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Giỏ hàng */}
          {wishlistOpen && (
            <section className="orders-section wishlist-section">
              <div className="section-heading-row">
                <h3>♥ Sản phẩm yêu thích ({wishlist.length})</h3>
                <button
                  className="btn-close"
                  onClick={() => setWishlistOpen(false)}
                  aria-label="Đóng danh sách yêu thích"
                >
                  ×
                </button>
              </div>

              {wishlist.length === 0 ? (
                <p className="empty-state">
                  Bạn chưa lưu sản phẩm nào.
                </p>
              ) : (
                <div className="wishlist-list">
                  {wishlist.map(item => (
                    <div className="wishlist-item" key={item.id}>
                      <img
                        src={item.product?.imageUrl}
                        alt={item.product?.name}
                      />
                      <div className="wishlist-item-info">
                        <strong>{item.product?.name}</strong>
                        <span>{item.product?.brand}</span>
                        <b>
                          {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND"
                          }).format(item.product?.price || 0)}
                        </b>
                      </div>
                      <button
                        className="btn-danger"
                        onClick={() => handleToggleWishlist({ id: item.productId })}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="orders-section cart-section">
            <div className="section-heading-row">
              <h3>🛒 Giỏ hàng ({cartCount} sản phẩm)</h3>
              {cart.length > 0 && (
                <button className="btn-primary" onClick={openCheckout}>
                  Tiến hành đặt hàng
                </button>
              )}
            </div>
            {cart.length === 0 ? (
              <p className="empty-state">Chưa có sản phẩm trong giỏ hàng.</p>
            ) : (
              <>
                {cart.map(item => (
                  <div className="cart-item" key={item.productId}>
                    <img src={item.imageUrl} alt={item.name} />
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <span>{item.formattedPrice}</span>
                    </div>
                    <div className="cart-quantity">
                      <button type="button" onClick={() => updateCartQuantity(item.productId, item.quantity - 1)}>-</button>
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={e => updateCartQuantity(item.productId, e.target.value)}
                      />
                      <button type="button" onClick={() => updateCartQuantity(item.productId, item.quantity + 1)}>+</button>
                    </div>
                    <strong className="cart-item-total">
                      {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price * item.quantity)}
                    </strong>
                    <button className="btn-danger" onClick={() => removeFromCart(item.productId)}>Xóa</button>
                  </div>
                ))}
                <div className="cart-total-row">
                  <span>Tổng cộng</span>
                  <strong>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cartTotal)}</strong>
                </div>
              </>
            )}
          </section>

          {/* Danh sách đơn hàng đã đặt của khách */}
          <section className="orders-section">
            <h3>📦 Đơn hàng của bạn ({orders.length} đơn)</h3>
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 4 }}>
                    Đơn hàng #{order.id} • {order.customerName} ({order.phone})
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Địa chỉ: {order.address} • Ngày: {order.createdAt}
                  </div>
                  <div style={{ fontSize: "0.85rem", marginTop: 4 }}>
                    {order.items?.map(i => (
                      <span key={i.productId} style={{ color: "#a5b4fc", marginRight: 12 }}>
                        • {i.productName} x{i.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#38bdf8", marginBottom: 6 }}>
                    {order.formattedTotal}
                  </div>
                  <span className={`status-badge ${order.status}`}>
                    ● {order.statusText}
                  </span>
                  {order.status === "PENDING" && (
                    <button
                      className="btn-danger"
                      style={{ display: "block", marginTop: 10, marginLeft: "auto" }}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Hủy đơn
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        </div>
      )}

      {/* VIEW: QUẢN TRỊ VIÊN (ADMIN / MANAGER) */}
      {activeRole === "ADMIN" && (
        <div>
          <div className="view-header">
            <h2>Hệ thống Quản trị Doanh nghiệp TechStore</h2>
            <p>Dành cho Quản trị viên (ADMIN) & Trưởng phòng (MANAGER) điều phối kinh doanh</p>
          </div>

          <div className="admin-tabs">
            <button
              className={`admin-tab-btn ${adminTab === "PRODUCTS" ? "active" : ""}`}
              onClick={() => setAdminTab("PRODUCTS")}
            >
              📱 Quản lý Điện thoại ({products.length})
            </button>
            <button
              className={`admin-tab-btn ${adminTab === "ORDERS" ? "active" : ""}`}
              onClick={() => setAdminTab("ORDERS")}
            >
              📋 Quản lý Đơn hàng ({orders.length})
            </button>
            {canManageStaff && (
              <button
                className={`admin-tab-btn ${adminTab === "STAFF" ? "active" : ""}`}
                onClick={() => setAdminTab("STAFF")}
              >
                👥 Quản lý Nhân viên ({employees.length})
              </button>
            )}
          </div>

          {/* TAB 1: QUẢN LÝ SẢN PHẨM */}
          {adminTab === "PRODUCTS" && (
            <div>
              {/* Form thêm sản phẩm */}
              <div className="admin-card-section">
                <h3 style={{ marginBottom: 16 }}>{editingProductId ? "✏️ Cập nhật điện thoại" : "+ Thêm Điện Thoại Mới Vào Kho"} (CRUD)</h3>
                <form onSubmit={handleCreateProduct}>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Tên điện thoại:</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: iPhone 16 Plus 128GB"
                        value={newProduct.name}
                        onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Hãng (Thương hiệu):</label>
                      <select
                        className="form-input"
                        value={newProduct.brand}
                        onChange={e => setNewProduct({ ...newProduct, brand: e.target.value })}
                      >
                        <option value="Apple">Apple</option>
                        <option value="Samsung">Samsung</option>
                        <option value="Xiaomi">Xiaomi</option>
                        <option value="OPPO">OPPO</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Giá bán (VNĐ):</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="VD: 25990000"
                        value={newProduct.price}
                        onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Số lượng trong kho:</label>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="VD: 20"
                        value={newProduct.stock}
                        onChange={e => setNewProduct({ ...newProduct, stock: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Bộ nhớ (Storage):</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: 128GB / 256GB"
                        value={newProduct.storage}
                        onChange={e => setNewProduct({ ...newProduct, storage: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Màu sắc:</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: Titan Sa Mạc"
                        value={newProduct.color}
                        onChange={e => setNewProduct({ ...newProduct, color: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>URL hình ảnh:</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="https://..."
                        value={newProduct.imageUrl}
                        onChange={e => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                      {editingProductId ? "Lưu thay đổi" : "+ Thêm vào kho hàng"}
                    </button>
                    {editingProductId && (
                      <button type="button" className="btn-danger" onClick={cancelEditProduct}>
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Bảng sản phẩm */}
              <div className="admin-card-section">
                <h3 style={{ marginBottom: 16 }}>Danh sách điện thoại hiện có</h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Hình ảnh & Tên máy</th>
                        <th>Hãng</th>
                        <th>Giá bán</th>
                        <th>Tồn kho</th>
                        <th>Cấu hình</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id}>
                          <td>#{p.id}</td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td><span className="brand-pill" style={{ position: "static" }}>{p.brand}</span></td>
                          <td style={{ color: "#38bdf8", fontWeight: 700 }}>{p.formattedPrice}</td>
                          <td>
                            <span className={`stock-info ${p.isAvailable ? "in-stock" : "out-of-stock"}`}>
                              {p.stock} chiếc
                            </span>
                          </td>
                          <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            {p.specs?.ram} • {p.specs?.storage} • {p.specs?.color}
                          </td>
                          <td>
                            <button
                              className="btn-primary"
                              style={{ padding: "6px 12px", marginRight: 8 }}
                              onClick={() => startEditProduct(p)}
                            >
                              Sửa
                            </button>
                            <button
                              className="btn-danger"
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                            >
                              Xóa máy
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUẢN LÝ ĐƠN HÀNG */}
          {adminTab === "ORDERS" && (
            <div className="admin-card-section">
              <h3 style={{ marginBottom: 16 }}>Duyệt & Quản Lý Đơn Hàng Khách Đặt</h3>
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng & SĐT</th>
                      <th>Địa chỉ nhận</th>
                      <th>Sản phẩm đặt</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Đổi trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td>#{o.id}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>{o.phone}</div>
                        </td>
                        <td style={{ maxWidth: 200 }}>{o.address}</td>
                        <td>
                          {o.items?.map(i => (
                            <div key={i.productId} style={{ fontSize: "0.85rem" }}>
                              • {i.productName} (x{i.quantity})
                            </div>
                          ))}
                        </td>
                        <td style={{ color: "#38bdf8", fontWeight: 700 }}>{o.formattedTotal}</td>
                        <td>
                          <span className={`status-badge ${o.status}`}>
                            {o.statusText}
                          </span>
                        </td>
                        <td>
                          <select
                            className="status-select"
                            value={o.status}
                            onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                          >
                            <option value="PENDING">Chờ duyệt</option>
                            <option value="CONFIRMED">Đã xác nhận</option>
                            <option value="SHIPPED">Đang giao hàng</option>
                            <option value="DELIVERED">Đã giao hàng</option>
                            <option value="CANCELLED">Hủy đơn</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: QUẢN LÝ NHÂN VIÊN */}
          {canManageStaff && adminTab === "STAFF" && (
            <div>
              {/* Form thêm nhân viên */}
              <div className="admin-card-section">
                <h3 style={{ marginBottom: 16 }}>{editingStaffId ? "✏️ Cập nhật nhân sự" : "+ Tuyển Dụng / Thêm Nhân Sự Mới"}</h3>
                <form onSubmit={handleCreateStaff}>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Tên đăng nhập (Username):</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: saler_minh"
                        value={newStaff.username}
                        onChange={e => setNewStaff({ ...newStaff, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Họ và tên nhân viên:</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: Đặng Văn Minh"
                        value={newStaff.fullName}
                        onChange={e => setNewStaff({ ...newStaff, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mật khẩu ban đầu:</label>
                      <input
                        type="password"
                        className="form-input"
                        placeholder="Ít nhất 6 ký tự"
                        value={newStaff.password}
                        onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                        minLength={6}
                        required={!editingStaffId}
                      />
                    </div>
                    <div className="form-group">
                      <label>Chức vụ (Role):</label>
                      <select
                        className="form-input"
                        value={newStaff.role}
                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                      >
                        <option value="SALER">SALER - Nhân viên bán hàng</option>
                        <option value="MANAGER">MANAGER - Trưởng phòng quản lý</option>
                        <option value="ADMIN">ADMIN - Quản trị viên</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Số điện thoại:</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="VD: 0912333444"
                        value={newStaff.phone}
                        onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email:</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="email@example.com"
                        value={newStaff.email}
                        onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="submit" className="btn-primary" style={{ padding: "10px 24px" }}>
                      {editingStaffId ? "Lưu thay đổi" : "+ Lưu hồ sơ nhân sự"}
                    </button>
                    {editingStaffId && (
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => {
                          setEditingStaffId(null);
                          setNewStaff({ username: "", password: "", fullName: "", role: "SALER", phone: "", email: "" });
                        }}
                      >
                        Hủy chỉnh sửa
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Bảng nhân viên */}
              <div className="admin-card-section">
                <h3 style={{ marginBottom: 16 }}>Danh Sách Đội Ngũ Nhân Sự</h3>
                <div style={{ overflowX: "auto" }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Họ tên & Tài khoản</th>
                        <th>Chức vụ</th>
                        <th>Số điện thoại</th>
                        <th>Email</th>
                        <th>Ngày tạo</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map(u => (
                        <tr key={u.id}>
                          <td>#{u.id}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>@{u.username}</div>
                          </td>
                          <td>
                            <span className="brand-pill" style={{
                              position: "static",
                              borderColor: u.role === "ADMIN" ? "#f43f5e" : u.role === "MANAGER" ? "#fbbf24" : "#38bdf8",
                              color: u.role === "ADMIN" ? "#fb7185" : u.role === "MANAGER" ? "#fcd34d" : "#7dd3fc"
                            }}>
                              {u.roleTitle}
                            </span>
                          </td>
                          <td>{u.phone || "---"}</td>
                          <td>{u.email || "---"}</td>
                          <td style={{ color: "var(--text-muted)" }}>{u.createdAt}</td>
                          <td>
                            <button
                              className="btn-primary"
                              style={{ padding: "6px 12px", marginRight: 8 }}
                              onClick={() => startEditStaff(u)}
                            >
                              Sửa
                            </button>
                            <button className="btn-danger" onClick={() => handleDeleteStaff(u)}>
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL CHECKOUT (CUSTOMER) */}
      {checkoutOpen && cart.length > 0 && (
        <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🛍️ Xác nhận đơn hàng</h3>
              <button className="btn-close" onClick={() => setCheckoutOpen(false)}>×</button>
            </div>

            <div className="order-summary-box">
              {cart.map(item => (
                <div className="summary-row" key={item.productId}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="summary-row total">
                <span>Tổng thanh toán:</span>
                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(cartTotal)}</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder}>
              <div className="form-group">
                <label>Họ và tên người nhận:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Nguyễn Văn A"
                  value={orderForm.customerName}
                  onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại:</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="VD: 0912345678"
                  value={orderForm.phone}
                  onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Địa chỉ nhận hàng:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Số 20 phố Trần Phú, Ba Đình, Hà Nội"
                  value={orderForm.address}
                  onChange={e => setOrderForm({ ...orderForm, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ghi chú đơn hàng (không bắt buộc):</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Giao buổi chiều hoặc gọi trước khi tới"
                  value={orderForm.note}
                  onChange={e => setOrderForm({ ...orderForm, note: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-muted)",
                    padding: 12,
                    borderRadius: 8,
                    cursor: "pointer"
                  }}
                  onClick={() => setCheckoutOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 2, padding: 12 }}
                >
                  Xác Nhận Đặt Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
