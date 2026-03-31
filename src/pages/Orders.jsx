import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

// Maps each status to a CSS class + label
const STATUS_META = {
  PLACED: { label: "Placed", cls: "status-placed" },
  CONFIRMED: { label: "Confirmed", cls: "status-confirmed" },
  SHIPPED: { label: "Shipped", cls: "status-shipped" },
  DELIVERED: { label: "Delivered", cls: "status-delivered" },
  CANCELLED: { label: "Cancelled", cls: "status-cancelled" },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        // GET /api/orders/my — returns only this user's orders
        const res = await axiosInstance.get("/api/orders/my");
        // Show newest orders first
        setOrders(res.data.reverse());
      } catch (err) {
        console.error("Failed to load orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="page-center">
        <div className="loading-spinner" />
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Orders</h1>
        <p>{orders.length} {orders.length === 1 ? "order" : "orders"} placed</p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => {
            const meta = STATUS_META[order.status] || { label: order.status, cls: "" };
            const date = new Date(order.orderedAt).toLocaleDateString("en-IN", {
              year: "numeric", month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            });

            return (
              <div key={order.id} className="order-card">
                {/* Order header */}
                <div className="order-header">
                  <div>
                    <span className="order-id">Order #{order.id.slice(-8).toUpperCase()}</span>
                    <span className="order-date">{date}</span>
                  </div>
                  <span className={`status-pill ${meta.cls}`}>{meta.label}</span>
                </div>

                {/* Order items */}
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

                {/* Order footer */}
                <div className="order-footer">
                  <div className="order-address">
                    <span>📍</span> {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                  </div>
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
  );
}
