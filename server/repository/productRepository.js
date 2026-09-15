import { Op, Sequelize } from "sequelize";
import { ProductModel } from "../models/index.js";
import { Product } from "../entity/Product.js";

const toEntity = (row) => {
  if (!row) return null;
  const data = row.get({ plain: true });
  return new Product({
    id: data.id,
    name: data.name,
    brand: data.brand,
    price: data.price,
    stock: data.stock,
    specs: { ram: data.ram, storage: data.storage, color: data.color },
    imageUrl: data.imageUrl,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  });
};

const normalizeId = (id) => {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
};

export const productRepository = {
  async findAll() {
    const rows = await ProductModel.findAll({ order: [["id", "DESC"]] });
    return rows.map(toEntity);
  },

  async findById(id) {
    const productId = normalizeId(id);
    if (!productId) return null;
    return toEntity(await ProductModel.findByPk(productId));
  },

  async findByBrand(brand) {
    if (!brand || brand === "ALL") return this.findAll();
    const rows = await ProductModel.findAll({
      where: Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("brand")),
        brand.toLowerCase()
      ),
      order: [["id", "DESC"]]
    });
    return rows.map(toEntity);
  },

  async findByFilters({ brand, search, minPrice, maxPrice, page = 1, pageSize = 20 } = {}) {
    const conditions = [];
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedPageSize = Math.min(100, Math.max(1, Number(pageSize) || 20));

    if (brand && brand !== "ALL") {
      conditions.push(Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.col("brand")),
        brand.toLowerCase()
      ));
    }
    if (search) {
      conditions.push({ [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { brand: { [Op.like]: `%${search}%` } }
      ] });
    }
    if (minPrice !== undefined && minPrice !== "") {
      conditions.push({ price: { [Op.gte]: Number(minPrice) } });
    }
    if (maxPrice !== undefined && maxPrice !== "") {
      conditions.push({ price: { [Op.lte]: Number(maxPrice) } });
    }

    const where = conditions.length ? { [Op.and]: conditions } : undefined;
    const offset = (normalizedPage - 1) * normalizedPageSize;
    const { count, rows } = await ProductModel.findAndCountAll({
      where,
      order: [["id", "DESC"]],
      limit: normalizedPageSize,
      offset
    });

    return {
      products: rows.map(toEntity),
      total: Number(count),
      page: normalizedPage,
      pageSize: normalizedPageSize
    };
  },

  async create(productEntity) {
    const row = await ProductModel.create({
      name: productEntity.name,
      brand: productEntity.brand,
      price: productEntity.price,
      stock: productEntity.stock,
      ram: productEntity.specs.ram,
      storage: productEntity.specs.storage,
      color: productEntity.specs.color,
      imageUrl: productEntity.imageUrl,
      status: productEntity.stock > 0 ? "ACTIVE" : "OUT_OF_STOCK"
    });
    return toEntity(row);
  },

  async update(id, updatedFields) {
    const productId = normalizeId(id);
    if (!productId) return null;

    const values = {};
    if (updatedFields.name !== undefined) values.name = updatedFields.name;
    if (updatedFields.brand !== undefined) values.brand = updatedFields.brand;
    if (updatedFields.price !== undefined) values.price = updatedFields.price;
    if (updatedFields.stock !== undefined) values.stock = updatedFields.stock;
    if (updatedFields.imageUrl !== undefined) values.imageUrl = updatedFields.imageUrl;
    if (updatedFields.specs?.ram !== undefined) values.ram = updatedFields.specs.ram;
    if (updatedFields.specs?.storage !== undefined) values.storage = updatedFields.specs.storage;
    if (updatedFields.specs?.color !== undefined) values.color = updatedFields.specs.color;
    if (updatedFields.stock !== undefined) {
      values.status = Number(updatedFields.stock) > 0 ? "ACTIVE" : "OUT_OF_STOCK";
    }

    if (Object.keys(values).length > 0) {
      await ProductModel.update(values, { where: { id: productId } });
    }
    return this.findById(productId);
  },

  async reduceStock(id, quantity) {
    const productId = normalizeId(id);
    if (!productId) return null;
    const [affected] = await ProductModel.update(
      { stock: Sequelize.literal(`stock - ${Number(quantity)}`) },
      { where: { id: productId, stock: { [Op.gte]: quantity } } }
    );
    if (affected > 0) {
      await ProductModel.update(
        { status: Sequelize.literal("CASE WHEN stock <= 0 THEN 'OUT_OF_STOCK' ELSE 'ACTIVE' END") },
        { where: { id: productId } }
      );
    }
    return this.findById(productId);
  },

  async delete(id) {
    const productId = normalizeId(id);
    if (!productId) return false;
    return (await ProductModel.destroy({ where: { id: productId } })) > 0;
  }
};
