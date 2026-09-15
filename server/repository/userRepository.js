import { Op, col, fn, where } from "sequelize";
import { UserModel } from "../models/index.js";
import { User } from "../entity/User.js";
import { Role } from "../enums/Role.js";

const toEntity = (row) => row && new User(row.get({ plain: true }));

export const userRepository = {
  async findAll() {
    const rows = await UserModel.findAll({ order: [["id", "DESC"]] });
    return rows.map(toEntity);
  },
  async findById(id) {
    return toEntity(await UserModel.findByPk(id));
  },
  async findByUsername(username) {
    const row = await UserModel.findOne({
      where: where(fn("LOWER", col("username")), username.toLowerCase())
    });
    return toEntity(row);
  },
  async findEmployees() {
    const rows = await UserModel.findAll({
      where: { role: { [Op.in]: [Role.ADMIN, Role.MANAGER, Role.SALER] } },
      order: [["id", "DESC"]]
    });
    return rows.map(toEntity);
  },
  async create(userEntity) {
    const row = await UserModel.create({
      username: userEntity.username,
      password: userEntity.password,
      fullName: userEntity.fullName,
      role: userEntity.role,
      phone: userEntity.phone || null,
      email: userEntity.email || null
    });
    return toEntity(row);
  },
  async update(id, fields) {
    const values = {};
    if (fields.username !== undefined) values.username = fields.username;
    if (fields.fullName !== undefined) values.fullName = fields.fullName;
    if (fields.password !== undefined) values.password = fields.password;
    if (fields.role !== undefined) values.role = fields.role;
    if (fields.phone !== undefined) values.phone = fields.phone || null;
    if (fields.email !== undefined) values.email = fields.email || null;
    if (Object.keys(values).length > 0) {
      await UserModel.update(values, { where: { id } });
    }
    return this.findById(id);
  },
  async updateProfile(id, fields) {
    await UserModel.update(
      { fullName: fields.fullName, phone: fields.phone || null, email: fields.email || null },
      { where: { id } }
    );
    return this.findById(id);
  },
  async updatePassword(id, password) {
    await UserModel.update({ password }, { where: { id } });
    return this.findById(id);
  },
  async delete(id) {
    return (await UserModel.destroy({ where: { id } })) > 0;
  }
};
