import { QueryTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import jwt from "jsonwebtoken";
import { appConfig } from "../config/appConfig.js";

const apiUrl = process.env.API_URL || "http://localhost:5000/api";
const username = `smoke_${Date.now()}`;
const password = "Smoke123456";
let token;
const orderIds = [];
let refreshCookie;

const request = async (path, options = {}) => {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(refreshCookie ? { Cookie: refreshCookie } : {}),
      ...(options.headers || {})
    }
  });
  const setCookie = response.headers.getSetCookie?.()[0] || response.headers.get("set-cookie");
  if (setCookie) refreshCookie = setCookie.split(";")[0];
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status}: ${body.message || "Request failed"}`);
  return body;
};

const run = async () => {
  let productBefore;
  let secondProductBefore;
  try {
    await request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, fullName: "Smoke Test", phone: "0900000000" })
    });
    const login = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    token = login.token;
    const refreshed = await request("/auth/refresh", { method: "POST" });
    token = refreshed.token;
    const auth = { Authorization: `Bearer ${token}` };

    productBefore = (await request("/products/1")).data;
    secondProductBefore = (await request("/products/2")).data;
    const created = await request("/orders", {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        customerName: "Smoke Test",
        phone: "0900000000",
        address: "Smoke Test Address",
        items: [
          { productId: 1, quantity: 1 },
          { productId: 2, quantity: 2 }
        ]
      })
    });
    orderIds.push(created.data.id);

    if (created.data.items.length !== 2) {
      throw new Error("Multi-item order did not return both line items");
    }
    const createdProductIds = created.data.items
      .map((item) => Number(item.productId))
      .sort((a, b) => a - b);
    if (createdProductIds[0] !== 1 || createdProductIds[1] !== 2) {
      throw new Error("Order line items do not match the requested products");
    }
    const orderDetails = await request(`/orders/${created.data.id}`, { headers: auth });
    if (orderDetails.data.items.length !== 2) {
      throw new Error("Customer order details did not return all line items");
    }
    const myOrders = await request("/orders/my", { headers: auth });
    const createdOrderInList = myOrders.data.find(
      (order) => Number(order.id) === Number(created.data.id)
    );
    if (!createdOrderInList || createdOrderInList.items.length !== 2) {
      throw new Error("Customer order list did not include the new multi-item order");
    }


    const productAfterOrder = (await request("/products/1")).data;
    if (productAfterOrder.stock !== productBefore.stock - 1) {
      throw new Error("Tồn kho không giảm đúng sau khi đặt hàng");
    }

    const secondProductAfterOrder = (await request("/products/2")).data;
    if (secondProductAfterOrder.stock !== secondProductBefore.stock - 2) {
      throw new Error("Stock for the second item was not decremented correctly");
    }

    await request(`/orders/${orderIds[0]}/cancel`, { method: "PATCH", headers: auth });
    const productAfterCancel = (await request("/products/1")).data;
    if (productAfterCancel.stock !== productBefore.stock) {
      throw new Error("Tồn kho không được hoàn lại sau khi hủy đơn");
    }

    const secondProductAfterCancel = (await request("/products/2")).data;
    if (secondProductAfterCancel.stock !== secondProductBefore.stock) {
      throw new Error("Stock for the second item was not restored after cancellation");
    }

    const adminToken = jwt.sign(
      { id: 1, username: "admin_boss", role: "ADMIN" },
      appConfig.jwtSecret
    );
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const secondOrder = await request("/orders", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        customerName: "Smoke Test",
        phone: "0900000000",
        address: "Smoke Test Address",
        items: [{ productId: 1, quantity: 1 }]
      })
    });
    orderIds.push(secondOrder.data.id);
    const productAfterAdminOrder = (await request("/products/1")).data;
    await request(`/orders/${secondOrder.data.id}/status`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({ status: "CANCELLED" })
    });
    const productAfterAdminCancel = (await request("/products/1")).data;
    if (productAfterAdminCancel.stock !== productBefore.stock) {
      throw new Error("Hủy đơn bởi ADMIN không hoàn lại tồn kho");
    }
    if (productAfterAdminOrder.stock !== productBefore.stock - 1) {
      throw new Error("Tồn kho không giảm đúng cho đơn thứ hai");
    }
    const adminOrders = await request("/orders", { headers: adminHeaders });
    if (!Array.isArray(adminOrders.data)) throw new Error("ADMIN không đọc được danh sách đơn hàng");
    const employees = await request("/users/employees", { headers: adminHeaders });
    if (!Array.isArray(employees.data)) throw new Error("ADMIN không đọc được danh sách nhân sự");

    console.log("Smoke test passed: auth, multi-item order, stock rollback and admin access.");
  } finally {
    // Xóa dữ liệu tạm, không ảnh hưởng dữ liệu người dùng hiện có.
    if (token) {
      for (const id of orderIds) {
        try { await request(`/orders/${id}/cancel`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }); } catch {}
      }
    }
    const testUsers = await sequelize.query(
      "SELECT id FROM users WHERE username = ?",
      { replacements: [username], type: QueryTypes.SELECT }
    );
    for (const user of testUsers) {
      await sequelize.query("DELETE FROM orders WHERE user_id = ?", {
        replacements: [user.id]
      });
      await sequelize.query("DELETE FROM users WHERE id = ?", {
        replacements: [user.id]
      });
    }
    await sequelize.close();
  }
};

run().catch((error) => {
  console.error("Smoke test failed:", error.message);
  process.exitCode = 1;
});
