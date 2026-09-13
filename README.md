# 🚀 Dự án Học React & Node.js Express Fullstack

Chào mừng bạn đến với môi trường lập trình Fullstack hiện đại! Dự án này kết nối giữa **React 19 (Frontend)** và **Node.js Express (Backend)**.

---

## 📁 Cấu trúc thư mục

```text
hocReact/
├── package.json          # Quản lý script khởi chạy đồng thời cả hai phần
├── client/               # Ứng dụng React (giao diện người dùng)
│   ├── src/
│   │   ├── App.jsx       # Component chính chứa giao diện Dashboard & gọi API
│   │   ├── App.css       # Hiệu ứng Glassmorphism, animations và layout
│   │   ├── index.css     # Hệ màu, font chữ Google Fonts
│   │   └── main.jsx      # Điểm bắt đầu của React
│   └── vite.config.js    # Cấu hình Vite & Proxy kết nối sang Backend
└── server/               # Ứng dụng Node.js Express (Backend API)
    ├── package.json
    └── index.js          # REST API Server chạy tại cổng 5000
```

---

## ⚡ Cách chạy dự án

### Cách 1: Chạy tất cả với 1 lệnh duy nhất (Khuyên dùng)
1. Mở Terminal trong VS Code bằng tổ hợp phím **`Ctrl + \``** (hoặc vào menu `Terminal` > `New Terminal`).
2. Gõ lệnh:
   ```bash
   npm run dev
   ```
3. Terminal sẽ đồng thời khởi động:
   - **Backend**: `http://localhost:5000`
   - **Frontend**: `http://localhost:5173`
4. Giữ phím `Ctrl` và click vào đường link `http://localhost:5173` trong Terminal để mở trên trình duyệt.

---

## 💡 Lưu ý quan trọng trên VS Code
- Nếu VS Code hiển thị thanh màu xanh hoặc thông báo **Restricted Mode**, hãy click vào chữ **Manage** rồi chọn **Trust** để mở khóa terminal và extensions.
