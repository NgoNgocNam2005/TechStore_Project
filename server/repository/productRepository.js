import { pool } from "../config/database.js";
import { Product } from "../entity/Product.js";

const columns = `
  id, name, brand, price, stock, ram, storage, color,
  image_url, status, created_at, updated_at
`;

const toEntity = (row) => row && new Product({
  id: row.id,
  name: row.name,
  brand: row.brand,
  price: row.price,
  stock: row.stock,
  specs: { ram: row.ram, storage: row.storage, color: row.color },
  imageUrl: row.image_url,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const normalizeId = (id) => {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
};

export const productRepository = {
  async findAll() {
    const [rows] = await pool.query(`SELECT ${columns} FROM products ORDER BY id DESC`);
    return rows.map(toEntity);
  },

  async findById(id) {
    const productId = normalizeId(id);
    if (!productId) return null;
    const [rows] = await pool.query(`SELECT ${columns} FROM products WHERE id = ?`, [productId]);
    return toEntity(rows[0]);
  },

  async findByBrand(brand) {
    if (!brand || brand === "ALL") return this.findAll();
    const [rows] = await pool.query(
      `SELECT ${columns} FROM products WHERE LOWER(brand) = LOWER(?) ORDER BY id DESC`,
      [brand]
    );
    return rows.map(toEntity);
  },

  async findByFilters({ brand, search, minPrice, maxPrice, page = 1, pageSize = 20 } = {}) {
    const conditions = [];
    const params = [];
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedPageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));

    if (brand && brand !== "ALL") {
      conditions.push("LOWER(brand) = LOWER(?)");
      params.push(brand);
    }
    if (search) {
      conditions.push("(name LIKE ? OR brand LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (minPrice !== undefined && minPrice !== "") {
      conditions.push("price >= ?");
      params.push(Number(minPrice));
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      conditions.push("price <= ?");
      params.push(Number(maxPrice));
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM products ${where}`, params);
    const offset = (normalizedPage - 1) * normalizedPageSize;
    const [rows] = await pool.query(
      `SELECT ${columns} FROM products ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, normalizedPageSize, offset]
    );

    return {
      products: rows.map(toEntity),
      total: Number(countRows[0].total),
      page: normalizedPage,
      pageSize: normalizedPageSize
    };
  },

  async create(productEntity) {
    const [result] = await pool.execute(
      `INSERT INTO products (name, brand, price, stock, ram, storage, color, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        productEntity.name,
        productEntity.brand,
        productEntity.price,
        productEntity.stock,
        productEntity.specs.ram,
        productEntity.specs.storage,
        productEntity.specs.color,
        productEntity.imageUrl,
        productEntity.stock > 0 ? "ACTIVE" : "OUT_OF_STOCK"
      ]
    );
    return this.findById(result.insertId);
  },

  async update(id, updatedFields) {
    const productId = normalizeId(id);
    if (!productId) return null;

    const assignments = [];
    const values = [];
    const add = (column, value) => {
      if (value !== undefined) {
        assignments.push(`${column} = ?`);
        values.push(value);
      }
    };

    add("name", updatedFields.name);
    add("brand", updatedFields.brand);
    add("price", updatedFields.price);
    add("stock", updatedFields.stock);
    add("image_url", updatedFields.imageUrl);
    add("ram", updatedFields.specs?.ram);
    add("storage", updatedFields.specs?.storage);
    add("color", updatedFields.specs?.color);
    if (updatedFields.stock !== undefined) {
      add("status", Number(updatedFields.stock) > 0 ? "ACTIVE" : "OUT_OF_STOCK");
    }

    if (assignments.length === 0) return this.findById(productId);
    values.push(productId);
    await pool.execute(`UPDATE products SET ${assignments.join(", ")} WHERE id = ?`, values);
    return this.findById(productId);
  },

  async reduceStock(id, quantity) {
    const productId = normalizeId(id);
    if (!productId) return null;
    await pool.execute(
      `UPDATE products
       SET stock = stock - ?, status = CASE WHEN stock - ? <= 0 THEN 'OUT_OF_STOCK' ELSE 'ACTIVE' END
       WHERE id = ? AND stock >= ?`,
      [quantity, quantity, productId, quantity]
    );
    return this.findById(productId);
  },

  async delete(id) {
    const productId = normalizeId(id);
    if (!productId) return false;
    const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [productId]);
    return result.affectedRows > 0;
  }
};
