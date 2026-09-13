import { pool } from "../config/database.js";
import { User } from "../entity/User.js";
import { Role } from "../enums/Role.js";

const columns = "id, username, password, full_name, role, phone, email, created_at";
const toEntity = (row) => row && new User({
  id: row.id, username: row.username, password: row.password,
  fullName: row.full_name, role: row.role, phone: row.phone,
  email: row.email, createdAt: row.created_at
});

export const userRepository = {
  async findAll() {
    const [rows] = await pool.query(`SELECT ${columns} FROM users ORDER BY id DESC`);
    return rows.map(toEntity);
  },
  async findById(id) {
    const [rows] = await pool.query(`SELECT ${columns} FROM users WHERE id = ?`, [id]);
    return toEntity(rows[0]);
  },
  async findByUsername(username) {
    const [rows] = await pool.query(
      `SELECT ${columns} FROM users WHERE LOWER(username) = LOWER(?)`,
      [username]
    );
    return toEntity(rows[0]);
  },
  async findEmployees() {
    const [rows] = await pool.query(
      `SELECT ${columns} FROM users WHERE role IN (?, ?, ?) ORDER BY id DESC`,
      [Role.ADMIN, Role.MANAGER, Role.SALER]
    );
    return rows.map(toEntity);
  },
  async create(userEntity) {
    const [result] = await pool.execute(
      "INSERT INTO users (username, password, full_name, role, phone, email) VALUES (?, ?, ?, ?, ?, ?)",
      [userEntity.username, userEntity.password, userEntity.fullName, userEntity.role, userEntity.phone || null, userEntity.email || null]
    );
    return this.findById(result.insertId);
  },
  async update(id, fields) {
    const assignments = [];
    const values = [];
    const add = (column, value) => {
      if (value !== undefined) {
        assignments.push(`${column} = ?`);
        values.push(value);
      }
    };

    add("username", fields.username);
    add("full_name", fields.fullName);
    add("password", fields.password);
    add("role", fields.role);
    if (fields.phone !== undefined) add("phone", fields.phone || null);
    if (fields.email !== undefined) add("email", fields.email || null);
    if (assignments.length === 0) return this.findById(id);

    values.push(id);
    await pool.execute(`UPDATE users SET ${assignments.join(", ")} WHERE id = ?`, values);
    return this.findById(id);
  },
  async updateProfile(id, fields) {
    await pool.execute(
      "UPDATE users SET full_name = ?, phone = ?, email = ? WHERE id = ?",
      [fields.fullName, fields.phone || null, fields.email || null, id]
    );
    return this.findById(id);
  },
  async updatePassword(id, password) {
    await pool.execute("UPDATE users SET password = ? WHERE id = ?", [password, id]);
    return this.findById(id);
  },
  async delete(id) {
    const [result] = await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};
