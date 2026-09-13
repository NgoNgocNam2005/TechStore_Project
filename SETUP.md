# TechStore - hướng dẫn chạy dự án

## 1. Cài đặt

Yêu cầu Node.js 20+ và MySQL 8+.

```powershell
npm install
npm run install:all
Copy-Item server/.env.example server/.env
```

Điền thông tin MySQL trong `server/.env`. Không commit file `.env`.

## 2. Khởi tạo database

Chạy lần lượt trong MySQL Workbench hoặc client MySQL:

```sql
SOURCE C:/LichViet/hocReact/server/database/schema.sql;
SOURCE C:/LichViet/hocReact/server/database/seed.sql;
```

Nếu database đã tồn tại từ phiên bản trước, chạy thêm:

```powershell
npm run db:migrate
```

Các tài khoản mẫu trong seed dùng mật khẩu `123456`:

- `admin_boss` — ADMIN
- `manager_linh` — MANAGER
- `saler_tuan` — SALER
- `customer_nam` — CUSTOMER

Nếu database đã được tạo từ seed cũ, cần chạy lại `seed.sql` hoặc reset schema để thay hash mật khẩu mẫu cũ.

## 3. Chạy ứng dụng

```powershell
npm run dev
```

- Client: `http://localhost:5173`
- API: `http://localhost:5000/api/status`

## 4. Kiểm tra trước khi bàn giao

```powershell
npm run build
npm run lint
# cần mở một terminal khác và chạy npm run dev trước dòng này
npm run test:smoke
```

Đặt hàng được xử lý trong transaction: sản phẩm được khóa khi kiểm tra tồn kho, tạo đơn và trừ kho; hủy đơn `PENDING` sẽ hoàn lại tồn kho.

Access token có thời hạn ngắn; refresh token được lưu dưới dạng hash trong MySQL và gửi cho trình duyệt bằng HttpOnly cookie.
