import { DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";

const common = { freezeTableName: true, timestamps: false };

export const UserModel = sequelize.define("User", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  fullName: { type: DataTypes.STRING(100), allowNull: false, field: "full_name" },
  role: { type: DataTypes.ENUM("CUSTOMER", "MANAGER", "ADMIN", "SALER"), allowNull: false },
  phone: DataTypes.STRING(20),
  email: DataTypes.STRING(100),
  createdAt: { type: DataTypes.DATE, field: "created_at" },
}, { tableName: "users", ...common });

export const RefreshTokenModel = sequelize.define("RefreshToken", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.BIGINT, allowNull: false, field: "user_id" },
  tokenHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true, field: "token_hash" },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
  revokedAt: { type: DataTypes.DATE, field: "revoked_at" },
  createdAt: { type: DataTypes.DATE, field: "created_at" },
}, { tableName: "refresh_tokens", ...common });

export const AddressModel = sequelize.define("Address", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.BIGINT, allowNull: false, field: "user_id" },
  label: { type: DataTypes.STRING(50), allowNull: false },
  recipientName: { type: DataTypes.STRING(100), allowNull: false, field: "recipient_name" },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  addressLine: { type: DataTypes.TEXT, allowNull: false, field: "address_line" },
  ward: DataTypes.STRING(100),
  district: DataTypes.STRING(100),
  province: DataTypes.STRING(100),
  isDefault: { type: DataTypes.BOOLEAN, allowNull: false, field: "is_default" },
  createdAt: { type: DataTypes.DATE, field: "created_at" },
  updatedAt: { type: DataTypes.DATE, field: "updated_at" },
}, { tableName: "addresses", ...common });

export const ProductModel = sequelize.define("Product", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  brand: { type: DataTypes.STRING(50), allowNull: false },
  price: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
  stock: { type: DataTypes.INTEGER, allowNull: false },
  ram: DataTypes.STRING(20),
  storage: DataTypes.STRING(20),
  color: DataTypes.STRING(50),
  imageUrl: { type: DataTypes.TEXT, field: "image_url" },
  status: { type: DataTypes.ENUM("ACTIVE", "OUT_OF_STOCK", "INACTIVE"), allowNull: false },
  createdAt: { type: DataTypes.DATE, field: "created_at" },
  updatedAt: { type: DataTypes.DATE, field: "updated_at" },
}, { tableName: "products", ...common });

export const WishlistModel = sequelize.define("Wishlist", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.BIGINT, allowNull: false, field: "user_id" },
  productId: { type: DataTypes.BIGINT, allowNull: false, field: "product_id" },
  createdAt: { type: DataTypes.DATE, field: "created_at" },
}, { tableName: "wishlists", ...common });

export const OrderModel = sequelize.define("Order", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: "user_id",
  },
  customerName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: "customer_name",
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  totalAmount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: "total_amount",
  },
  status: {
    type: DataTypes.ENUM(
      "PENDING",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED"
    ),
    allowNull: false,
  },
  note: DataTypes.TEXT,
  createdAt: {
    type: DataTypes.DATE,
    field: "created_at",
  },
}, {
  tableName: "orders",
  timestamps: false,
  freezeTableName: true,
});


export const OrderDetailModel = sequelize.define("OrderDetail", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    field: "order_id",
  },
  productId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: "product_id",
  },
  productName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: "product_name",
  },
  unitPrice: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: "price",
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  subTotal: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    field: "sub_total",
  },
}, {
  tableName: "order_items",
  timestamps: false,
  freezeTableName: true,
});

// Một hóa đơn có nhiều dòng hàng
OrderModel.hasMany(OrderDetailModel, {
  foreignKey: "orderId",
  as: "details",
});

// Mỗi dòng hàng thuộc về một hóa đơn và tham chiếu một sản phẩm
OrderDetailModel.belongsTo(OrderModel, {
  foreignKey: "orderId",
  as: "order",
});

OrderDetailModel.belongsTo(ProductModel, {
  foreignKey: "productId",
  as: "product",
});

ProductModel.hasMany(OrderDetailModel, {
  foreignKey: "productId",
  as: "orderDetails",
});

export const ProductReviewModel = sequelize.define("ProductReview", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.BIGINT, allowNull: false, field: "user_id" },
  productId: { type: DataTypes.BIGINT, allowNull: false, field: "product_id" },
  rating: { type: DataTypes.TINYINT, allowNull: false },
  comment: DataTypes.TEXT,
  createdAt: { type: DataTypes.DATE, field: "created_at" },
  updatedAt: { type: DataTypes.DATE, field: "updated_at" },
}, { tableName: "product_reviews", ...common });

UserModel.hasMany(AddressModel, { foreignKey: "userId", as: "addresses" });
UserModel.hasMany(OrderModel, { foreignKey: "userId", as: "orders" });
OrderModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });
UserModel.hasMany(ProductReviewModel, { foreignKey: "userId", as: "reviews" });
UserModel.hasMany(RefreshTokenModel, { foreignKey: "userId", as: "refreshTokens" });
ProductModel.hasMany(WishlistModel, { foreignKey: "productId", as: "wishlists" });
ProductModel.hasMany(ProductReviewModel, { foreignKey: "productId", as: "reviews" });
WishlistModel.belongsTo(ProductModel, { foreignKey: "productId", as: "product" });
ProductReviewModel.belongsTo(UserModel, { foreignKey: "userId", as: "user" });
ProductReviewModel.belongsTo(ProductModel, { foreignKey: "productId", as: "product" });
