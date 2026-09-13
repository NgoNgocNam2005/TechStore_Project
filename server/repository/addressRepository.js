import { pool } from "../config/database.js";
import { Address } from "../entity/Address.js";

const columns = `id, user_id, label, recipient_name, phone, address_line,
  ward, district, province, is_default, created_at, updated_at`;

const toEntity = row => row && new Address({
  id: row.id,
  userId: row.user_id,
  label: row.label,
  recipientName: row.recipient_name,
  phone: row.phone,
  addressLine: row.address_line,
  ward: row.ward,
  district: row.district,
  province: row.province,
  isDefault: row.is_default,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const normalizeId = id => {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
};

export const addressRepository = {
  async findByUserId(userId) {
    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId) return [];
    const [rows] = await pool.query(
      `SELECT ${columns} FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC`,
      [normalizedUserId]
    );
    return rows.map(toEntity);
  },

  async findByIdForUser(id, userId) {
    const addressId = normalizeId(id);
    const normalizedUserId = normalizeId(userId);
    if (!addressId || !normalizedUserId) return null;
    const [rows] = await pool.query(
      `SELECT ${columns} FROM addresses WHERE id = ? AND user_id = ?`,
      [addressId, normalizedUserId]
    );
    return toEntity(rows[0]);
  },

  async create(userId, fields) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      if (fields.isDefault) {
        await connection.execute("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [userId]);
      }
      const [result] = await connection.execute(
        `INSERT INTO addresses
          (user_id, label, recipient_name, phone, address_line, ward, district, province, is_default)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, fields.label, fields.recipientName, fields.phone, fields.addressLine,
          fields.ward || null, fields.district || null, fields.province || null, fields.isDefault]
      );
      await connection.commit();
      return this.findByIdForUser(result.insertId, userId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async update(id, userId, fields) {
    const addressId = normalizeId(id);
    const normalizedUserId = normalizeId(userId);
    if (!addressId || !normalizedUserId) return null;
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      if (fields.isDefault === true) {
        await connection.execute("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [normalizedUserId]);
      }
      const assignments = [];
      const values = [];
      const add = (column, value) => {
        if (value !== undefined) {
          assignments.push(`${column} = ?`);
          values.push(value);
        }
      };
      add("label", fields.label);
      add("recipient_name", fields.recipientName);
      add("phone", fields.phone);
      add("address_line", fields.addressLine);
      add("ward", fields.ward || null);
      add("district", fields.district || null);
      add("province", fields.province || null);
      add("is_default", fields.isDefault);
      if (assignments.length > 0) {
        values.push(addressId, normalizedUserId);
        await connection.execute(
          `UPDATE addresses SET ${assignments.join(", ")} WHERE id = ? AND user_id = ?`,
          values
        );
      }
      await connection.commit();
      return this.findByIdForUser(addressId, normalizedUserId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async delete(id, userId) {
    const addressId = normalizeId(id);
    const normalizedUserId = normalizeId(userId);
    if (!addressId || !normalizedUserId) return false;
    const [result] = await pool.execute(
      "DELETE FROM addresses WHERE id = ? AND user_id = ?",
      [addressId, normalizedUserId]
    );
    return result.affectedRows > 0;
  }
};
