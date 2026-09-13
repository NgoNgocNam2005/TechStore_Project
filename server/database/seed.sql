USE techstore_db;

-- 1. Nạp dữ liệu nền cho bảng users (Nhân sự)
INSERT INTO users (username, password, full_name, role, phone, email) VALUES
('admin_boss', '$2b$10$vrT0bt1UY2HlFcbHm9hqHO8nGRA.9U2ju3MjOac9VAeN5XTj9NnX6', 'Vũ Văn Quản Trị', 'ADMIN', '0909999888', 'admin@techstore.vn'),
('manager_linh', '$2b$10$vrT0bt1UY2HlFcbHm9hqHO8nGRA.9U2ju3MjOac9VAeN5XTj9NnX6', 'Trần Mai Linh', 'MANAGER', '0908888777', 'linh.tran@techstore.vn'),
('saler_tuan', '$2b$10$vrT0bt1UY2HlFcbHm9hqHO8nGRA.9U2ju3MjOac9VAeN5XTj9NnX6', 'Nguyễn Anh Tuấn', 'SALER', '0907777666', 'tuan.nguyen@techstore.vn'),
('saler_huong', '$2b$10$vrT0bt1UY2HlFcbHm9hqHO8nGRA.9U2ju3MjOac9VAeN5XTj9NnX6', 'Lê Thu Hương', 'SALER', '0906666555', 'huong.le@techstore.vn'),
('customer_nam', '$2b$10$vrT0bt1UY2HlFcbHm9hqHO8nGRA.9U2ju3MjOac9VAeN5XTj9NnX6', 'Nguyễn Hoàng Nam', 'CUSTOMER', '0912345678', 'nam.nguyen@example.com');

-- 2. Nạp dữ liệu nền cho bảng products (Các dòng điện thoại bán chạy)
INSERT INTO products (name, brand, price, stock, ram, storage, color, image_url, status) VALUES
('iPhone 16 Pro Max 256GB', 'Apple', 34990000.00, 15, '8GB', '256GB', 'Titan Sa Mạc', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80', 'ACTIVE'),
('Samsung Galaxy S24 Ultra 512GB', 'Samsung', 31990000.00, 20, '12GB', '512GB', 'Xám Titan', 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&q=80', 'ACTIVE'),
('Xiaomi 14 Ultra 512GB', 'Xiaomi', 24990000.00, 8, '16GB', '512GB', 'Trắng Da Gốm', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&q=80', 'ACTIVE'),
('iPhone 15 128GB', 'Apple', 19490000.00, 25, '6GB', '128GB', 'Xanh Pastel', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80', 'ACTIVE'),
('OPPO Find N3 Flip', 'OPPO', 18990000.00, 10, '12GB', '256GB', 'Hồng Thạch Anh', 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=500&q=80', 'ACTIVE'),
('Samsung Galaxy Z Fold6 256GB', 'Samsung', 41990000.00, 5, '12GB', '256GB', 'Xanh Navy', 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=500&q=80', 'ACTIVE'),
('Xiaomi Redmi Note 13 Pro+ 5G', 'Xiaomi', 9490000.00, 30, '8GB', '256GB', 'Tím Cực Quang', 'https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=500&q=80', 'ACTIVE');

-- 3. Nạp dữ liệu nền cho bảng orders & order_items
INSERT INTO orders (id, user_id, customer_name, phone, address, total_amount, status, note) VALUES
(1001, (SELECT id FROM users WHERE username = 'customer_nam'), 'Nguyễn Hoàng Nam', '0912345678', 'Số 15 Lê Duẩn, Quận 1, TP. Hồ Chí Minh', 34990000.00, 'CONFIRMED', 'Giao hàng giờ hành chính giúp mình');

INSERT INTO order_items (order_id, product_id, product_name, price, quantity, sub_total) VALUES
(1001, 1, 'iPhone 16 Pro Max 256GB', 34990000.00, 1, 34990000.00);

-- Các tài khoản mẫu đều dùng mật khẩu: 123456
UPDATE users
SET password = '$2b$10$vrT0bt1UY2HlFcbHm9hqHO8nGRA.9U2ju3MjOac9VAeN5XTj9NnX6'
WHERE username IN ('admin_boss', 'manager_linh', 'saler_tuan', 'saler_huong', 'customer_nam');
