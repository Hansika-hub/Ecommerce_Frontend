import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const EMPTY_FORM = {
  name: "", description: "", price: "", stockQuantity: "", category: "", imageUrl: "", color: "Standard", size: "Universal"
};

const ORDER_STATUSES = ["Placed", "Confirmed", "Shipped", "Delivered", "Cancelled"];

export default function AdminDashboard() {
  const [tab, setTab] = useState("products"); // "products" | "orders"

  // --- Products state ---
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null); // null = adding new, string = editing existing
  const [showForm, setShowForm] = useState(false);
  const [prodMsg, setProdMsg] = useState({ text: "", type: "" });
  const [prodLoading, setProdLoading] = useState(true);

  // --- Orders state ---
  const [orders, setOrders] = useState([]);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderMsg, setOrderMsg] = useState({ text: "", type: "" });

  const fetchProducts = async () => {
    try {
      const res = await axiosInstance.get("/api/products/public/all");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setProdLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrderLoading(true);
    try {
      const res = await axiosInstance.get("/api/orders/all");
      setOrders(res.data.reverse());
    } catch (err) {
      console.error(err);
    } finally {
      setOrderLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => { if (tab === "orders") fetchOrders(); }, [tab]);

  const showProdMsg = (text, type = "success") => {
    setProdMsg({ text, type });
    setTimeout(() => setProdMsg({ text: "", type: "" }), 3000);
  };

  const showOrderMsg = (text, type = "success") => {
    setOrderMsg({ text, type });
    setTimeout(() => setOrderMsg({ text: "", type: "" }), 3000);
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    const variant = product.variants?.[0] || {};
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.variants?.[0]?.price || 0,
      stockQuantity: variant.stock || 0,
      category: product.category?.categoryName || "General",
      imageUrl: product.images?.[0] || "",
      color: variant.color || "Standard",
      size: variant.size || "Universal"
    });
    setEditId(product.id);
    setShowForm(true);
  };

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stockQuantity || !form.category) {
      showProdMsg("Name, price, stock, and category are required.", "error");
      return;
    }
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: {
          categoryId: "C_" + Math.random().toString(36).substr(2, 5),
          categoryName: form.category,
          description: form.category + " items"
        },
        images: form.imageUrl ? [form.imageUrl] : [],
        variants: [
          {
            variantId: "V_" + Math.random().toString(36).substr(2, 5),
            color: form.color || "Standard",
            size: form.size || "Universal",
            stock: parseInt(form.stockQuantity),
            price: parseFloat(form.price)
          }
        ]
      };

      if (editId) {
        await axiosInstance.put(`/api/products/${editId}`, payload);
        showProdMsg("Product updated successfully.");
      } else {
        await axiosInstance.post("/api/products", payload);
        showProdMsg("Product added successfully.");
      }

      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      fetchProducts();
    } catch (err) {
      showProdMsg(err.response?.data?.error || "Operation failed.", "error");
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await axiosInstance.delete(`/api/products/${id}`);
      showProdMsg(`"${name}" deleted.`);
      fetchProducts();
    } catch (err) {
      showProdMsg(err.response?.data?.error || "Delete failed.", "error");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axiosInstance.put(`/api/orders/${orderId}/status?status=${status}`);
      showOrderMsg(`Order status updated to ${status}.`);
      fetchOrders();
    } catch {
      showOrderMsg("Failed to update status.", "error");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
      </div>

      {/* Tab switcher */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${tab === "products" ? "active" : ""}`}
          onClick={() => setTab("products")}
        >
          Products
        </button>
        <button
          className={`admin-tab ${tab === "orders" ? "active" : ""}`}
          onClick={() => setTab("orders")}
        >
          All Orders
        </button>
      </div>

      {/* ================= PRODUCTS TAB ================= */}
      {tab === "products" && (
        <div className="admin-section">
          {prodMsg.text && (
            <div className={`toast ${prodMsg.type === "error" ? "toast-error" : ""}`}>
              {prodMsg.text}
            </div>
          )}

          <div className="admin-toolbar">
            <span>{products.length} products</span>
            <button className="btn-primary" onClick={openAddForm}>+ Add Product</button>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <div className="admin-form-card">
              <h2>{editId ? "Edit Product" : "Add New Product"}</h2>
              <form onSubmit={handleFormSubmit} className="auth-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input name="name" value={form.name} onChange={handleFormChange} placeholder="iPhone 15" />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <input name="category" value={form.category} onChange={handleFormChange} placeholder="Electronics" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" rows={2} value={form.description} onChange={handleFormChange} placeholder="Product description..." />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input type="number" name="price" value={form.price} onChange={handleFormChange} placeholder="79999" min="0" />
                  </div>
                  <div className="form-group">
                    <label>Stock Quantity *</label>
                    <input type="number" name="stockQuantity" value={form.stockQuantity} onChange={handleFormChange} placeholder="50" min="0" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Image URL</label>
                  <input name="imageUrl" value={form.imageUrl} onChange={handleFormChange} placeholder="https://..." />
                </div>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="submit" className="btn-primary">
                    {editId ? "Update Product" : "Add Product"}
                  </button>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => { setShowForm(false); setEditId(null); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          {prodLoading ? (
            <div className="page-center"><div className="loading-spinner" /></div>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const variant = p.variants?.[0] || {};
                    return (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td><span className="product-category">{p.category?.categoryName || "General"}</span></td>
                        <td>₹{(variant.price || 0).toLocaleString("en-IN")}</td>
                        <td>
                          <span className={variant.stock === 0 ? "text-danger" : ""}>
                            {variant.stock || 0}
                          </span>
                        </td>
                        <td>
                          <span className={`status-pill ${p.status === "active" ? "status-delivered" : "status-cancelled"}`}>
                            {p.status === "active" ? "Active" : "Deleted"}
                          </span>
                        </td>
                        <td>
                          <div className="action-btns">
                            <button className="btn-edit" onClick={() => openEditForm(p)}>Edit</button>
                            <button className="btn-delete" onClick={() => handleDelete(p.id, p.name)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= ORDERS TAB ================= */}
      {tab === "orders" && (
        <div className="admin-section">
          {orderMsg.text && (
            <div className={`toast ${orderMsg.type === "error" ? "toast-error" : ""}`}>
              {orderMsg.text}
            </div>
          )}

          {orderLoading ? (
            <div className="page-center"><div className="loading-spinner" /></div>
          ) : orders.length === 0 ? (
            <div className="empty-state"><p>No orders placed yet.</p></div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const date = new Date(order.orderedAt).toLocaleDateString("en-IN", {
                  year: "numeric", month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                });
                return (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div>
                        <span className="order-id">#{order.id.slice(-8).toUpperCase()}</span>
                        <span className="order-date">{date}</span>
                        <span className="admin-customer">Customer: {order.userId}</span>
                      </div>
                      {/* Status dropdown for admin */}
                      <select
                        className="status-select"
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="order-items">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="order-item-row">
                          <span className="item-name">{item.productName} {item.color ? `(${item.color}-${item.size})` : ''}</span>
                          <span className="item-qty">× {item.qty || item.quantity}</span>
                          <span className="item-amt">
                            ₹{((item.priceAtPurchase || item.price || 0) * (item.qty || item.quantity)).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="order-footer">
                      <div className="order-address">📍 {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</div>
                      <div className="order-total">
                        Total: <strong>₹{order.totalAmount.toLocaleString("en-IN")}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
