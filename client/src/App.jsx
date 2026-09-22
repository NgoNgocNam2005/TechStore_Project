import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import LoginPage from "./pages/LoginPage.jsx";
import AccountPanel from "./pages/AccountPanel.jsx";
import ReviewPanel from "./pages/ReviewPanel.jsx";
import OrderDetailsPanel from "./pages/OrderDetailsPanel.jsx";
import ProductDetailsPanel from "./pages/ProductDetailsPanel.jsx";

const normalizeOrderSearch = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim();

const orderStatusOptions = [
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPED", label: "Đang giao hàng" },
  { value: "DELIVERED", label: "Đã giao hàng" },
  { value: "CANCELLED", label: "Hủy đơn" },
];

const getStatusOptionsForRole = (role, currentStatus) => {
  if (role === "SALER") {
    return currentStatus === "PENDING"
      ? orderStatusOptions.filter((option) => ["PENDING", "CONFIRMED"].includes(option.value))
      : orderStatusOptions.filter((option) => option.value === currentStatus);
  }

  if (role === "SHIPPER") {
    const nextStatuses = currentStatus === "CONFIRMED"
      ? ["CONFIRMED", "SHIPPED"]
      : currentStatus === "SHIPPED"
        ? ["SHIPPED", "DELIVERED"]
        : [currentStatus];
    return orderStatusOptions.filter((option) => nextStatuses.includes(option.value));
  }

  return orderStatusOptions;
};

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
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartError, setCartError] = useState("");
  const cartWriteQueue = useRef(Promise.resolve());
  const [selectedCartIds, setSelectedCartIds] = useState(
    () => new Set(cart.map((item) => String(item.productId)))
  );
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersError, setOrdersError] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [adminOrderStatusFilter, setAdminOrderStatusFilter] = useState("ALL");
  const [adminOrderPaymentFilter, setAdminOrderPaymentFilter] = useState("ALL");
  const [adminOrderSearch, setAdminOrderSearch] = useState("");
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);

  // Phân quyền dựa trên user đang đăng nhập
  const activeRole = currentUser
    ? ["ADMIN", "MANAGER", "SALER", "SHIPPER"].includes(currentUser.role)
      ? "ADMIN"
      : "CUSTOMER"
    : "CUSTOMER";
  const canManageStaff = currentUser?.role === "ADMIN";
  const canManagePayment = ["ADMIN", "MANAGER"].includes(currentUser?.role);
  const currentRole = currentUser?.role;

  const handleLoginSuccess = (jwt, user) => {
    setToken(jwt);
    setCurrentUser(user);
    setCart([]);
    setSelectedCartIds(new Set());
    setCartLoaded(false);
    setCartError("");
    setOrders([]);
    setOrdersError("");
    setOrderStatusFilter("ALL");
    setOrderSearch("");
    setAdminOrderStatusFilter("ALL");
    setAdminOrderPaymentFilter("ALL");
    setAdminOrderSearch("");
    setWishlist([]);
    setAddresses([]);
    localStorage.setItem("techstore_user", JSON.stringify(user));
  };

  const clearSession = useCallback(() => {
    setToken(null);
    setCurrentUser(null);
    setCart([]);
    setSelectedCartIds(new Set());
    setCartLoaded(false);
    setCartError("");
    setOrders([]);
    setOrdersError("");
    setOrderStatusFilter("ALL");
    setOrderSearch("");
    setAdminOrderStatusFilter("ALL");
    setAdminOrderPaymentFilter("ALL");
    setAdminOrderSearch("");
    setWishlist([]);
    setAddresses([]);
    localStorage.removeItem("techstore_token");
    localStorage.removeItem("techstore_user");
  }, []);

  const authHeaders = useCallback((json = false) => ({
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  }), [token]);

  const replaceCartOnServer = useCallback(async (items) => {
    const response = await fetch("/api/users/me/cart", {
      method: "PUT",
      headers: authHeaders(true),
      body: JSON.stringify({
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || "Không thể lưu giỏ hàng vào tài khoản.");
    }
    return result.data || [];
  }, [authHeaders]);

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
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState("");
  const [productDetails, setProductDetails] = useState(null);
  const [productDetailsOpen, setProductDetailsOpen] = useState(false);
  const [productDetailsLoading, setProductDetailsLoading] = useState(false);
  const [productDetailsError, setProductDetailsError] = useState("");
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
    note: "",
    paymentMethod: "COD"
  });

  // Tab của Admin
  const [adminTab, setAdminTab] = useState("DASHBOARD"); // DASHBOARD | PRODUCTS | ORDERS | STAFF

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

  const openOrderDetails = async (orderId) => {
    setOrderDetailsOpen(true);
    setOrderDetails(null);
    setOrderDetailsError("");
    setOrderDetailsLoading(true);

    try {
      const detailsUrl = `/api/orders/${orderId}`;
      let response = await fetch(detailsUrl, {
        headers: authHeaders(),
      });

      if (response.status === 401) {
        const refreshResponse = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
        });

        if (!refreshResponse.ok) {
          clearSession();
          throw new Error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.");
        }

        const session = await refreshResponse.json();
        setToken(session.token);
        setCurrentUser(session.user);
        localStorage.setItem("techstore_user", JSON.stringify(session.user));
        response = await fetch(detailsUrl, {
          headers: { Authorization: `Bearer ${session.token}` },
        });
      }

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Không tải được chi tiết đơn hàng.");
      }
      setOrderDetails(result.data);
    } catch (error) {
      setOrderDetailsError(error.message || "Không tải được chi tiết đơn hàng.");
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const openProductDetails = async (productId) => {
    if (!productId) return;
    setProductDetailsOpen(true);
    setProductDetails(null);
    setProductDetailsError("");
    setProductDetailsLoading(true);

    try {
      const response = await fetch(`/api/products/${productId}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || "Không tải được thông tin sản phẩm.");
      }
      setProductDetails(result.data);
    } catch (error) {
      setProductDetailsError(error.message || "Không tải được thông tin sản phẩm.");
    } finally {
      setProductDetailsLoading(false);
    }
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const selectedCartItems = cart.filter((item) =>
    selectedCartIds.has(String(item.productId))
  );
  const selectedCartTotal = selectedCartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const allCartItemsSelected = cart.length > 0 && selectedCartItems.length === cart.length;
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      orderStatusFilter === "ALL" || order.status === orderStatusFilter;
    const items = order.items || order.details || [];
    const searchableText = [
      order.id,
      order.customerName,
      order.phone,
      order.address,
      order.statusText,
      ...items.flatMap((item) => [
        item.productName,
        item.name,
        item.product?.name,
      ]),
    ].filter(Boolean).join(" ");
    const matchesSearch = normalizeOrderSearch(searchableText).includes(
      normalizeOrderSearch(orderSearch),
    );

    return matchesStatus && matchesSearch;
  });
  const filteredAdminOrders = orders.filter((order) => {
    const matchesStatus = adminOrderStatusFilter === "ALL"
      || order.status === adminOrderStatusFilter;
    const matchesPayment = adminOrderPaymentFilter === "ALL"
      || (order.paymentStatus || "UNPAID") === adminOrderPaymentFilter;
    const items = order.items || order.details || [];
    const searchText = [
      order.id,
      order.customerName,
      order.phone,
      order.address,
      ...items.flatMap((item) => [item.productName, item.name]),
    ].filter(Boolean).join(" ");
    const matchesSearch = normalizeOrderSearch(searchText).includes(
      normalizeOrderSearch(adminOrderSearch),
    );
    return matchesStatus && matchesPayment && matchesSearch;
  });
  const lowStockProducts = products
    .filter((product) => product.status !== "INACTIVE" && Number(product.stock) <= 5)
    .sort((a, b) => Number(a.stock) - Number(b.stock));
  const adminMetrics = {
    productCount: products.length,
    orderCount: orders.length,
    pendingCount: orders.filter((order) => order.status === "PENDING").length,
    shippingCount: orders.filter((order) => ["CONFIRMED", "SHIPPED"].includes(order.status)).length,
    deliveredCount: orders.filter((order) => order.status === "DELIVERED").length,
  };
  const recentOrders = [...orders]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 5);

  useEffect(() => {
    if (!token || activeRole !== "CUSTOMER" || !cartLoaded) return undefined;

    let cancelled = false;
    const snapshot = cart.map(({ productId, quantity }) => ({ productId, quantity }));
    const write = cartWriteQueue.current
      .catch(() => {})
      .then(async () => {
        if (cancelled) return;
        await replaceCartOnServer(snapshot);
      });
    cartWriteQueue.current = write;

    write.then(() => {
      if (!cancelled) setCartError("");
    }).catch((error) => {
      if (!cancelled) setCartError(error.message || "Không thể đồng bộ giỏ hàng.");
    });

    return () => {
      cancelled = true;
    };
  }, [activeRole, cart, cartLoaded, replaceCartOnServer, token]);

  const handleAddToCart = (product) => {
    if (!cartLoaded) {
      showToast("Đang tải giỏ hàng của tài khoản, vui lòng thử lại sau giây lát.", "error");
      return;
    }
    const existing = cart.find(item => Number(item.productId) === Number(product.id));
    if (existing && existing.quantity >= product.stock) {
      showToast(`Sản phẩm "${product.name}" đã đạt số lượng tồn kho`, "error");
      return;
    }

    if (existing) {
      setCart(cart.map(item => Number(item.productId) === Number(product.id)
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
    setSelectedCartIds((current) => new Set([...current, String(product.id)]));
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
    setSelectedCartIds((current) => {
      const next = new Set(current);
      next.delete(String(productId));
      return next;
    });
  };

  const toggleCartItem = (productId) => {
    const id = String(productId);
    setSelectedCartIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllCartItems = (checked) => {
    setSelectedCartIds(
      checked ? new Set(cart.map((item) => String(item.productId))) : new Set()
    );
  };

  const openCheckout = () => {
    if (selectedCartItems.length === 0) {
      showToast("Hãy chọn ít nhất một sản phẩm để đặt hàng", "error");
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
    if (!cartLoaded) {
      showToast("Đang tải giỏ hàng của tài khoản, vui lòng thử lại sau giây lát.", "error");
      return;
    }
    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => Number(item.productId) === Number(product.id)
      );
      if (existing) return currentCart;
      return [...currentCart, {
        productId: product.id,
        name: product.name,
        price: product.price,
        formattedPrice: product.formattedPrice,
        imageUrl: product.imageUrl,
        stock: product.stock,
        quantity: 1
      }];
    });
    setSelectedCartIds(new Set([String(product.id)]));
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
        setOrdersError("");
      } else {
        const json = await orderRes.json().catch(() => ({}));
        setOrdersError(json.message || "Không tải được danh sách đơn hàng.");
      }

      if (activeRole === "CUSTOMER") {
        const cartRes = await fetch("/api/users/me/cart", {
          headers: authHeaders()
        });
        if (cartRes.status === 401) {
          if (await refreshSession()) return;
          clearSession();
          return;
        }
        const cartJson = await cartRes.json().catch(() => ({}));
        if (!cartRes.ok) {
          setCartLoaded(false);
          throw new Error(cartJson.message || "Không tải được giỏ hàng từ tài khoản.");
        }
        const savedCart = Array.isArray(cartJson.data) ? cartJson.data : [];
        setCart(savedCart);
        setSelectedCartIds(new Set(savedCart.map((item) => String(item.productId))));
        setCartError("");
        setCartLoaded(true);

        const wishlistRes = await fetch("/api/users/me/wishlist", {
          headers: authHeaders()
        });
        if (wishlistRes.ok) {
          const json = await wishlistRes.json();
          setWishlist(json.data || []);
        }

        const addressRes = await fetch("/api/users/me/addresses", {
          headers: authHeaders()
        });
        if (addressRes.ok) {
          const json = await addressRes.json();
          setAddresses(json.data || []);
        }
      } else {
        setCart([]);
        setSelectedCartIds(new Set());
        setCartLoaded(false);
        setWishlist([]);
        setAddresses([]);
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
      setCartError(err.message || "Không tải được dữ liệu tài khoản.");
      setOrdersError(err.message || "Không tải được danh sách đơn hàng.");
      setServerOnline(false);
    }
  }, [
    activeRole,
    authHeaders,
    clearSession,
    currentRole,
    refreshSession,
    setAddresses,
    setCart,
    setCartError,
    setCartLoaded,
    setEmployees,
    setOrders,
    setOrdersError,
    setProducts,
    setSelectedCartIds,
    setServerOnline,
    setWishlist,
  ]);

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
    if (selectedCartItems.length === 0) {
      showToast("Hãy chọn ít nhất một sản phẩm để đặt hàng", "error");
      return;
    }

    try {
      const payload = {
        customerName: orderForm.customerName,
        phone: orderForm.phone,
        address: orderForm.address,
        note: orderForm.note,
        paymentMethod: orderForm.paymentMethod,
        items: selectedCartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Đặt hàng thất bại");

      showToast("🎉 Đặt hàng thành công!");
      const orderedIds = new Set(
        selectedCartItems.map((item) => String(item.productId))
      );
      const remainingCart = cart.filter(
        (item) => !orderedIds.has(String(item.productId))
      );
      try {
        await replaceCartOnServer(remainingCart);
        setCartError("");
      } catch (cartSaveError) {
        setCartError(`Đơn đã tạo nhưng chưa đồng bộ được giỏ hàng: ${cartSaveError.message}`);
      }
      setCart(remainingCart);
      setSelectedCartIds((current) => new Set(
        [...current].filter((id) => !orderedIds.has(id))
      ));
      setCheckoutOpen(false);
      setOrderForm({
        customerName: "",
        phone: "",
        address: "",
        note: "",
        paymentMethod: "COD",
      });

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

  const handleUpdatePaymentStatus = async (id, paymentStatus) => {
    try {
      const res = await fetch(`/api/orders/${id}/payment-status`, {
        method: "PATCH",
        headers: authHeaders(true),
        body: JSON.stringify({ paymentStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Không thể cập nhật thanh toán");
      showToast(result.message);
      await loadData();
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

      {reviewProduct && (
        <ReviewPanel
          product={reviewProduct}
          currentUser={currentUser}
          authHeaders={authHeaders}
          onClose={() => setReviewProduct(null)}
          onToast={showToast}
          onSessionExpired={clearSession}
        />
      )}

      {orderDetailsOpen && (
        <OrderDetailsPanel
          order={orderDetails}
          loading={orderDetailsLoading}
          error={orderDetailsError}
          onClose={() => setOrderDetailsOpen(false)}
          onProductClick={openProductDetails}
        />
      )}

      {productDetailsOpen && (
        <ProductDetailsPanel
          product={productDetails}
          loading={productDetailsLoading}
          error={productDetailsError}
          onClose={() => setProductDetailsOpen(false)}
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
                  <button
                    type="button"
                    className="product-info-link"
                    onClick={() => openProductDetails(phone.id)}
                  >
                    Xem chi tiết sản phẩm
                  </button>

                  <div className="specs-tags">
                    <span className="spec-badge">RAM {phone.specs?.ram}</span>
                    <span className="spec-badge">Bộ nhớ {phone.specs?.storage}</span>
                    <span className="spec-badge">{phone.specs?.color}</span>
                  </div>

                  <button
                    type="button"
                    className="review-link"
                    onClick={() => setReviewProduct(phone)}
                  >
                    ⭐ Xem đánh giá sản phẩm
                  </button>

                  <div className="phone-footer">
                    <div>
                      <div className="phone-price">{phone.formattedPrice}</div>
                      <div className={`stock-info ${phone.isAvailable ? "in-stock" : "out-of-stock"}`}>
                        {phone.isAvailable ? `• Còn ${phone.stock} máy` : "• Hết hàng"}
                      </div>
                    </div>

                    <button
                      className="btn-buy"
                      disabled={!phone.isAvailable || !cartLoaded}
                      onClick={() => handleAddToCart(phone)}
                    >
                      {phone.isAvailable ? "Thêm giỏ" : "Tạm hết"}
                    </button>
                    {phone.isAvailable && (
                      <button
                        className="btn-buy btn-buy-secondary"
                        disabled={!cartLoaded}
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
              <h3>🛒 Giỏ hàng ({cart.length} mặt hàng, {cartCount} sản phẩm)</h3>
              {cart.length > 0 && (
                <div className="cart-heading-actions">
                  <label className="cart-select-all">
                    <input
                      type="checkbox"
                      checked={allCartItemsSelected}
                      onChange={(event) => toggleAllCartItems(event.target.checked)}
                    />
                    Chọn tất cả
                  </label>
                  <button
                    className="btn-primary"
                    onClick={openCheckout}
                    disabled={selectedCartItems.length === 0}
                  >
                    Đặt hàng ({selectedCartItems.length})
                  </button>
                </div>
              )}
            </div>
            {cartError && <p className="data-error" role="alert">{cartError}</p>}
            {!cartLoaded ? (
              <p className="empty-state">Đang tải giỏ hàng từ tài khoản...</p>
            ) : cart.length === 0 ? (
              <p className="empty-state">Chưa có sản phẩm trong giỏ hàng.</p>
            ) : (
              <>
                {cart.map(item => (
                  <div
                    className={`cart-item ${selectedCartIds.has(String(item.productId)) ? "selected" : ""}`}
                    key={item.productId}
                  >
                    <input
                      className="cart-select-checkbox"
                      type="checkbox"
                      checked={selectedCartIds.has(String(item.productId))}
                      onChange={() => toggleCartItem(item.productId)}
                      aria-label={`Chọn ${item.name} để đặt hàng`}
                    />
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
                  <span>Tạm tính sản phẩm đã chọn ({selectedCartItems.length})</span>
                  <strong>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedCartTotal)}</strong>
                </div>
              </>
            )}
          </section>

          {/* Danh sách đơn hàng đã đặt của khách */}
          <section className="orders-section">
            <h3>📦 Đơn hàng của bạn ({orders.length} đơn)</h3>
            {ordersError && <p className="data-error" role="alert">{ordersError}</p>}
            {!ordersError && orders.length === 0 && (
              <p className="empty-state">Bạn chưa có đơn hàng nào.</p>
            )}
            {orders.length > 0 && (
              <div className="order-filters">
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(event) => setOrderSearch(event.target.value)}
                  placeholder="Tìm mã đơn, tên, số điện thoại, sản phẩm..."
                  aria-label="Tìm kiếm đơn hàng"
                />
                <select
                  value={orderStatusFilter}
                  onChange={(event) => setOrderStatusFilter(event.target.value)}
                  aria-label="Lọc theo trạng thái đơn hàng"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING">Đang chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="SHIPPED">Đang giao</option>
                  <option value="DELIVERED">Đã giao</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
                <span>{filteredOrders.length}/{orders.length} đơn</span>
              </div>
            )}
            {!ordersError && orders.length > 0 && filteredOrders.length === 0 && (
              <p className="empty-state">Không tìm thấy đơn hàng phù hợp.</p>
            )}
            {filteredOrders.map(order => (
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
                  <div className="order-payment-summary">
                    <span>{order.paymentMethodText || "Thanh toán khi nhận hàng"}</span>
                    <span className={order.paymentStatus === "PAID" ? "paid" : "unpaid"}>
                      {order.paymentStatusText || "Chưa thanh toán"}
                    </span>
                  </div>
                  <button
                    className="order-detail-btn"
                    onClick={() => openOrderDetails(order.id)}
                  >
                    Xem chi tiết
                  </button>
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
              className={`admin-tab-btn ${adminTab === "DASHBOARD" ? "active" : ""}`}
              onClick={() => setAdminTab("DASHBOARD")}
            >
              📊 Tổng quan
            </button>
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

          {adminTab === "ORDERS" && (
            <div className="admin-order-filters">
              <input
                type="search"
                value={adminOrderSearch}
                onChange={(event) => setAdminOrderSearch(event.target.value)}
                placeholder="Tìm mã đơn, khách hàng, SĐT, sản phẩm..."
                aria-label="Tìm kiếm đơn hàng quản trị"
              />
              <select
                value={adminOrderStatusFilter}
                onChange={(event) => setAdminOrderStatusFilter(event.target.value)}
                aria-label="Lọc trạng thái đơn hàng quản trị"
              >
                <option value="ALL">Tất cả trạng thái</option>
                {orderStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={adminOrderPaymentFilter}
                onChange={(event) => setAdminOrderPaymentFilter(event.target.value)}
                aria-label="Lọc trạng thái thanh toán"
              >
                <option value="ALL">Tất cả thanh toán</option>
                <option value="UNPAID">Chưa thanh toán</option>
                <option value="PAID">Đã thanh toán</option>
              </select>
              <span>{filteredAdminOrders.length}/{orders.length} đơn</span>
            </div>
          )}

          {adminTab === "DASHBOARD" && (
            <div className="admin-dashboard">
              <div className="admin-dashboard-heading">
                <div>
                  <h3>Tổng quan cửa hàng</h3>
                  <p>Số liệu hiện tại từ danh sách sản phẩm và đơn hàng.</p>
                </div>
                <button className="role-btn" onClick={() => void loadData()}>
                  Làm mới dữ liệu
                </button>
              </div>

              <div className="admin-metrics-grid">
                <article className="admin-metric-card">
                  <span>Sản phẩm</span>
                  <strong>{adminMetrics.productCount}</strong>
                  <button onClick={() => setAdminTab("PRODUCTS")}>Mở quản lý sản phẩm</button>
                </article>
                <article className="admin-metric-card">
                  <span>Tổng đơn hàng</span>
                  <strong>{adminMetrics.orderCount}</strong>
                  <button onClick={() => setAdminTab("ORDERS")}>Mở quản lý đơn hàng</button>
                </article>
                <article className="admin-metric-card metric-warning">
                  <span>Chờ xác nhận</span>
                  <strong>{adminMetrics.pendingCount}</strong>
                  <button onClick={() => setAdminTab("ORDERS")}>Xử lý đơn chờ</button>
                </article>
                <article className="admin-metric-card">
                  <span>Đang xử lý / vận chuyển</span>
                  <strong>{adminMetrics.shippingCount}</strong>
                  <button onClick={() => setAdminTab("ORDERS")}>Theo dõi đơn hàng</button>
                </article>
                <article className="admin-metric-card metric-success">
                  <span>Đã giao</span>
                  <strong>{adminMetrics.deliveredCount}</strong>
                  <button onClick={() => setAdminTab("ORDERS")}>Xem đơn đã giao</button>
                </article>
              </div>

              <div className="admin-dashboard-columns">
                <section className="admin-card-section">
                  <div className="admin-dashboard-section-heading">
                    <h3>Cảnh báo tồn kho thấp</h3>
                    <span>{lowStockProducts.length} sản phẩm</span>
                  </div>
                  {lowStockProducts.length === 0 ? (
                    <p className="empty-state">Không có sản phẩm nào sắp hết hàng.</p>
                  ) : (
                    <div className="admin-dashboard-list">
                      {lowStockProducts.slice(0, 8).map((product) => (
                        <div className="admin-dashboard-row" key={product.id}>
                          <div>
                            <strong>{product.name}</strong>
                            <span>{product.brand}</span>
                          </div>
                          <b className={Number(product.stock) === 0 ? "stock-empty" : "stock-low"}>
                            {product.stock} còn lại
                          </b>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="role-btn" onClick={() => setAdminTab("PRODUCTS")}>
                    Đi đến kho sản phẩm
                  </button>
                </section>

                <section className="admin-card-section">
                  <div className="admin-dashboard-section-heading">
                    <h3>Đơn hàng mới nhất</h3>
                    <span>5 đơn gần đây</span>
                  </div>
                  {recentOrders.length === 0 ? (
                    <p className="empty-state">Chưa có đơn hàng.</p>
                  ) : (
                    <div className="admin-dashboard-list">
                      {recentOrders.map((order) => (
                        <div className="admin-dashboard-row" key={order.id}>
                          <div>
                            <strong>Đơn #{order.id} · {order.customerName}</strong>
                            <span>{order.createdAt}</span>
                          </div>
                          <div className="admin-dashboard-order-meta">
                            <b>{order.formattedTotal}</b>
                            <span className={`status-badge ${order.status}`}>{order.statusText}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="role-btn" onClick={() => setAdminTab("ORDERS")}>
                    Xem tất cả đơn hàng
                  </button>
                </section>
              </div>
            </div>
          )}

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
                      <th>Thanh toán</th>
                      <th>Trạng thái</th>
                      <th>Đổi trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminOrders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="empty-state">Không tìm thấy đơn hàng phù hợp.</td>
                      </tr>
                    )}
                    {filteredAdminOrders.map(o => (
                      <tr key={o.id}>
                        <td>
                          <div>#{o.id}</div>
                          <button
                            className="order-detail-btn"
                            onClick={() => openOrderDetails(o.id)}
                          >
                            Chi tiết
                          </button>
                        </td>
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
                          <select
                            className="payment-status-select"
                            value={o.paymentStatus || "UNPAID"}
                            disabled={!canManagePayment}
                            onChange={(event) => handleUpdatePaymentStatus(o.id, event.target.value)}
                          >
                            <option value="UNPAID">Chưa thanh toán</option>
                            <option value="PAID">Đã thanh toán</option>
                          </select>
                        </td>
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
                            disabled={getStatusOptionsForRole(currentRole, o.status).length === 1}
                          >
                            {getStatusOptionsForRole(currentRole, o.status).map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
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
                        <option value="SHIPPER">SHIPPER - Nhân viên giao hàng</option>
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
      {checkoutOpen && selectedCartItems.length > 0 && (
        <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🛍️ Xác nhận đơn hàng</h3>
              <button className="btn-close" onClick={() => setCheckoutOpen(false)}>×</button>
            </div>

            <div className="order-summary-box">
              {selectedCartItems.map(item => (
                <div className="summary-row" key={item.productId}>
                  <span>{item.name} × {item.quantity}</span>
                  <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="summary-row total">
                <span>Tổng thanh toán:</span>
                <span>{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(selectedCartTotal)}</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder}>
              {addresses.length > 0 && (
                <div className="form-group">
                  <label>Chọn địa chỉ đã lưu:</label>
                  <select
                    className="form-input"
                    defaultValue=""
                    onChange={e => {
                      const selected = addresses.find(a => String(a.id) === e.target.value);
                      if (!selected) return;
                      setOrderForm(f => ({
                        ...f,
                        customerName: selected.recipientName || f.customerName,
                        phone: selected.phone || f.phone,
                        address: [selected.addressLine, selected.ward, selected.district, selected.province]
                          .filter(Boolean).join(", ")
                      }));
                    }}
                  >
                    <option value="">-- Chọn nhanh địa chỉ đã lưu --</option>
                    {addresses.map(a => (
                      <option key={a.id} value={String(a.id)}>
                        {a.label}{a.isDefault ? " ★" : ""} — {a.recipientName}, {a.addressLine}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                <label>Phương thức thanh toán:</label>
                <label className="payment-option">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={orderForm.paymentMethod === "COD"}
                    onChange={(event) => setOrderForm((form) => ({
                      ...form,
                      paymentMethod: event.target.value,
                    }))}
                  />
                  <span>
                    <strong>Thanh toán khi nhận hàng (COD)</strong>
                    <small>Thanh toán cho nhân viên giao hàng khi nhận sản phẩm.</small>
                  </span>
                </label>
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
