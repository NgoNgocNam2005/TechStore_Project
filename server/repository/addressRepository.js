import { sequelize } from "../config/database.js";
import { AddressModel } from "../models/index.js";
import { Address } from "../entity/Address.js";

const toEntity = row => row && new Address(row.get({ plain: true }));

const normalizeId = id => {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
};

export const addressRepository = {
  async findByUserId(userId) {
    const normalizedUserId = normalizeId(userId);
    if (!normalizedUserId) return [];
    const rows = await AddressModel.findAll({
      where: { userId: normalizedUserId },
      order: [["isDefault", "DESC"], ["id", "DESC"]]
    });
    return rows.map(toEntity);
  },

  async findByIdForUser(id, userId) {
    const addressId = normalizeId(id);
    const normalizedUserId = normalizeId(userId);
    if (!addressId || !normalizedUserId) return null;
    return toEntity(await AddressModel.findOne({
      where: { id: addressId, userId: normalizedUserId }
    }));
  },

  async create(userId, fields) {
    const transaction = await sequelize.transaction();
    try {
      if (fields.isDefault) {
        await AddressModel.update(
          { isDefault: false },
          { where: { userId }, transaction }
        );
      }
      const row = await AddressModel.create({
        userId,
        label: fields.label,
        recipientName: fields.recipientName,
        phone: fields.phone,
        addressLine: fields.addressLine,
        ward: fields.ward || null,
        district: fields.district || null,
        province: fields.province || null,
        isDefault: Boolean(fields.isDefault)
      }, { transaction });
      await transaction.commit();
      return toEntity(row);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async update(id, userId, fields) {
    const addressId = normalizeId(id);
    const normalizedUserId = normalizeId(userId);
    if (!addressId || !normalizedUserId) return null;
    const transaction = await sequelize.transaction();
    try {
      if (fields.isDefault === true) {
        await AddressModel.update(
          { isDefault: false },
          { where: { userId: normalizedUserId }, transaction }
        );
      }
      const values = {};
      if (fields.label !== undefined) values.label = fields.label;
      if (fields.recipientName !== undefined) values.recipientName = fields.recipientName;
      if (fields.phone !== undefined) values.phone = fields.phone;
      if (fields.addressLine !== undefined) values.addressLine = fields.addressLine;
      if (fields.ward !== undefined) values.ward = fields.ward || null;
      if (fields.district !== undefined) values.district = fields.district || null;
      if (fields.province !== undefined) values.province = fields.province || null;
      if (fields.isDefault !== undefined) values.isDefault = fields.isDefault;
      if (Object.keys(values).length > 0) {
        await AddressModel.update(values, {
          where: { id: addressId, userId: normalizedUserId },
          transaction
        });
      }
      await transaction.commit();
      return this.findByIdForUser(addressId, normalizedUserId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async delete(id, userId) {
    const addressId = normalizeId(id);
    const normalizedUserId = normalizeId(userId);
    if (!addressId || !normalizedUserId) return false;
    return (await AddressModel.destroy({
      where: { id: addressId, userId: normalizedUserId }
    })) > 0;
  }
};
