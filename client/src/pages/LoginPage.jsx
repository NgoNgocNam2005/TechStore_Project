import { useState } from "react";

const API = "/api/auth";

export default function LoginPage({ onLoginSuccess }) {
  const [tab, setTab] = useState("login"); // "login" | "register"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({
    username: "",
    password: "",
    fullName: "",
    phone: "",
    email: "",
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      onLoginSuccess(json.token, json.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(regForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message);
      // Đăng ký thành công → chuyển sang tab login
      setTab("login");
      setLoginForm({ username: regForm.username, password: "" });
      setError("");
      alert("✅ " + json.message + "\nVui lòng đăng nhập.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background blobs */}
      <div style={{ ...styles.blob, ...styles.blob1 }} />
      <div style={{ ...styles.blob, ...styles.blob2 }} />
      <div style={{ ...styles.blob, ...styles.blob3 }} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoIcon}>📱</span>
          <div>
            <div style={styles.logoTitle}>TechStore</div>
            <div style={styles.logoSub}>Hệ thống quản lý cửa hàng</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabBar}>
          <button
            id="tab-login"
            style={{
              ...styles.tabBtn,
              ...(tab === "login" ? styles.tabBtnActive : {}),
            }}
            onClick={() => { setTab("login"); setError(""); }}
          >
            Đăng nhập
          </button>
          <button
            id="tab-register"
            style={{
              ...styles.tabBtn,
              ...(tab === "register" ? styles.tabBtnActive : {}),
            }}
            onClick={() => { setTab("register"); setError(""); }}
          >
            Đăng ký
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={styles.errorBox}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === "login" && (
          <form onSubmit={handleLogin} style={styles.form}>
            <div style={styles.welcome}>
              <h2 style={styles.welcomeTitle}>Chào mừng trở lại!</h2>
              <p style={styles.welcomeSub}>Đăng nhập để tiếp tục quản lý cửa hàng</p>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tên đăng nhập</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input
                  id="login-username"
                  type="text"
                  autoComplete="username"
                  placeholder="VD: admin_boss"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mật khẩu</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu của bạn"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            {/* Quick-fill hint */}
            <div style={styles.hintBox}>
              <div style={styles.hintTitle}>💡 Tài khoản demo:</div>
              <div style={styles.hintRow}>
                <span style={styles.hintBadge}>ADMIN</span>
                <code style={styles.hintCode}>admin_boss / secret_password_123</code>
              </div>
              <div style={styles.hintRow}>
                <span style={{ ...styles.hintBadge, background: "rgba(251,191,36,0.15)", color: "#fcd34d" }}>MANAGER</span>
                <code style={styles.hintCode}>manager_linh / secret_password_456</code>
              </div>
              <div style={styles.hintRow}>
                <span style={{ ...styles.hintBadge, background: "rgba(56,189,248,0.15)", color: "#7dd3fc" }}>SALER</span>
                <code style={styles.hintCode}>saler_tuan / secret_password_789</code>
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              style={{ ...styles.submitBtn, ...(loading ? styles.submitBtnDisabled : {}) }}
            >
              {loading ? "Đang đăng nhập..." : "🚀 Đăng nhập"}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === "register" && (
          <form onSubmit={handleRegister} style={styles.form}>
            <div style={styles.welcome}>
              <h2 style={styles.welcomeTitle}>Tạo tài khoản mới</h2>
              <p style={styles.welcomeSub}>Đăng ký để mua sắm tại TechStore</p>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Họ và tên <span style={{ color: "#f87171" }}>*</span></label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>✏️</span>
                <input
                  id="reg-fullname"
                  type="text"
                  placeholder="VD: Nguyễn Văn An"
                  value={regForm.fullName}
                  onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Tên đăng nhập <span style={{ color: "#f87171" }}>*</span></label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input
                  id="reg-username"
                  type="text"
                  autoComplete="username"
                  placeholder="VD: nguyen_an"
                  value={regForm.username}
                  onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Mật khẩu <span style={{ color: "#f87171" }}>*</span></label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>🔒</span>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Ít nhất 6 ký tự"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
            </div>

            <div style={styles.twoCol}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Số điện thoại</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>📞</span>
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="0912 345 678"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Email</label>
                <div style={styles.inputWrapper}>
                  <span style={styles.inputIcon}>📧</span>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="email@example.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>
            </div>

            <button
              id="btn-register-submit"
              type="submit"
              disabled={loading}
              style={{ ...styles.submitBtn, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", ...(loading ? styles.submitBtnDisabled : {}) }}
            >
              {loading ? "Đang tạo tài khoản..." : "✨ Tạo tài khoản"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Inline styles ────────────────────────────────────────────────────────────
const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 40%, #0a1628 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  blob: {
    position: "absolute",
    borderRadius: "50%",
    filter: "blur(80px)",
    opacity: 0.25,
    pointerEvents: "none",
  },
  blob1: {
    width: 500,
    height: 500,
    background: "radial-gradient(circle, #6366f1, transparent)",
    top: -100,
    left: -100,
  },
  blob2: {
    width: 400,
    height: 400,
    background: "radial-gradient(circle, #0ea5e9, transparent)",
    bottom: -80,
    right: -80,
  },
  blob3: {
    width: 300,
    height: 300,
    background: "radial-gradient(circle, #8b5cf6, transparent)",
    top: "50%",
    left: "60%",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 24,
    padding: "40px 44px",
    width: "100%",
    maxWidth: 480,
    boxShadow: "0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
    position: "relative",
    zIndex: 1,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 28,
  },
  logoIcon: {
    fontSize: 40,
    filter: "drop-shadow(0 0 12px rgba(99,102,241,0.8))",
  },
  logoTitle: {
    fontSize: "1.5rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #a5b4fc, #38bdf8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: "0.75rem",
    color: "rgba(255,255,255,0.45)",
    marginTop: 2,
  },
  tabBar: {
    display: "flex",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    padding: "9px 0",
    borderRadius: 9,
    border: "none",
    background: "transparent",
    color: "rgba(255,255,255,0.5)",
    fontWeight: 600,
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabBtnActive: {
    background: "rgba(255,255,255,0.10)",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
  },
  errorBox: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.35)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#fca5a5",
    fontSize: "0.875rem",
    marginBottom: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  welcome: {
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    color: "#fff",
    margin: 0,
  },
  welcomeSub: {
    fontSize: "0.83rem",
    color: "rgba(255,255,255,0.45)",
    marginTop: 4,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginBottom: 14,
  },
  label: {
    fontSize: "0.82rem",
    fontWeight: 600,
    color: "rgba(255,255,255,0.7)",
    letterSpacing: "0.02em",
  },
  inputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  inputIcon: {
    position: "absolute",
    left: 12,
    fontSize: "1rem",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    padding: "10px 12px 10px 38px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 10,
    color: "#fff",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  hintBox: {
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.2)",
    borderRadius: 10,
    padding: "12px 14px",
    marginBottom: 18,
    marginTop: 4,
  },
  hintTitle: {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 8,
  },
  hintRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
  },
  hintBadge: {
    fontSize: "0.65rem",
    fontWeight: 700,
    padding: "2px 7px",
    borderRadius: 5,
    background: "rgba(244,63,94,0.15)",
    color: "#fb7185",
    letterSpacing: "0.05em",
    whiteSpace: "nowrap",
  },
  hintCode: {
    fontSize: "0.72rem",
    color: "rgba(255,255,255,0.45)",
    fontFamily: "'Fira Code', monospace",
  },
  submitBtn: {
    marginTop: 8,
    padding: "13px",
    background: "linear-gradient(135deg, #6366f1, #0ea5e9)",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontWeight: 700,
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.15s",
    boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
    letterSpacing: "0.03em",
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};
