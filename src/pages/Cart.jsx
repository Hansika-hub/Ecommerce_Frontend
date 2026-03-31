import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState({ city: "", state: "", pincode: "" });
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("shopwave_cart") || "[]");
    setCartItems(items);
    setLoading(false);
  }, []);

  const saveCart = (items) => {
    setCartItems(items);
    localStorage.setItem("shopwave_cart", JSON.stringify(items));
  };

  const removeItem = (productId, variantId) => {
    saveCart(cartItems.filter(item => !(item.productId === productId && item.variantId === variantId)));
  };

  const updateQty = (productId, variantId, qty) => {
    if (qty < 1) return;
    saveCart(cartItems.map(item => {
      if (item.productId === productId && item.variantId === variantId) {
        return { ...item, qty };
      }
      return item;
    }));
  };

  const placeOrder = async () => {
    if (!address.city || !address.state || !address.pincode) {
      showMsg("Please enter complete shipping address (City, State, Pincode).", "error");
      return;
    }
    if (cartItems.length === 0) {
      showMsg("Cart is empty.", "error");
      return;
    }

    setPlacing(true);

    const totalAmount = cartItems.reduce((acc, curr) => acc + (curr.priceAtPurchase * curr.qty), 0);

    const orderPayload = {
      items: cartItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        qty: item.qty,
        priceAtPurchase: item.priceAtPurchase
      })),
      shippingAddress: address,
      totalAmount: totalAmount
    };

    try {
      await axiosInstance.post(`/api/orders/place`, orderPayload);
      showMsg("Order placed successfully! 🎉", "success");
      localStorage.removeItem("shopwave_cart");
      setCartItems([]);
      setTimeout(() => navigate("/orders"), 1500);
    } catch (err) {
      showMsg(err.response?.data?.error || "Failed to place order.", "error");
    } finally {
      setPlacing(false);
    }
  };

  const showMsg = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  if (loading) {
    return (
      <div className="page-center">
        <div className="loading-spinner" />
        <p>Loading cart...</p>
      </div>
    );
  }

  const isEmpty = cartItems.length === 0;
  const totalAmount = cartItems.reduce((acc, curr) => acc + (curr.priceAtPurchase * curr.qty), 0);

  return (
    <div className="page">
      {message.text && (
        <div className={`toast ${message.type === "error" ? "toast-error" : ""}`}>
          {message.text}
        </div>
      )}

      <div className="page-header">
        <h1>Your Cart</h1>
        <p>{cartItems.length} {cartItems.length === 1 ? "item" : "items"}</p>
      </div>

      {isEmpty ? (
        <div className="empty-state">
          <div className="empty-icon">🛒</div>
          <p>Your cart is empty.</p>
          <button className="btn-primary" onClick={() => navigate("/products")}>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cartItems.map((item) => (
              <div key={`${item.productId}-${item.variantId}`} className="cart-item">
                <div className="cart-item-img">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                  ) : (
                    item.productName?.charAt(0)
                  )}
                </div>
                <div className="cart-item-info">
                  <h3>{item.productName}</h3>
                  <p style={{ fontSize: '0.8rem', color: '#666' }}>Variant: {item.color} - {item.size}</p>
                  <p className="item-price">₹{item.priceAtPurchase.toLocaleString("en-IN")} each</p>
                </div>
                <div className="cart-item-qty">
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.productId, item.variantId, item.qty - 1)}
                  >
                    −
                  </button>
                  <span className="qty-value">{item.qty}</span>
                  <button
                    className="qty-btn"
                    onClick={() => updateQty(item.productId, item.variantId, item.qty + 1)}
                  >
                    +
                  </button>
                </div>
                <div className="cart-item-subtotal">
                  ₹{(item.priceAtPurchase * item.qty).toLocaleString("en-IN")}
                </div>
                <button
                  className="btn-remove"
                  onClick={() => removeItem(item.productId, item.variantId)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2>Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal ({cartItems.length} items)</span>
              <span>₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="free">Free</span>
            </div>
            <div className="summary-total">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString("en-IN")}</span>
            </div>

            <div className="form-group" style={{ marginTop: "1.5rem" }}>
              <label>Shipping City</label>
              <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City" />

              <label style={{ marginTop: '10px' }}>State</label>
              <input type="text" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} placeholder="State" />

              <label style={{ marginTop: '10px' }}>Pincode</label>
              <input type="text" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} placeholder="Pincode" />
            </div>

            <button
              className="btn-primary"
              onClick={placeOrder}
              disabled={placing}
              style={{ width: "100%", marginTop: '15px' }}
            >
              {placing ? <span className="spinner" /> : "Place Order"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
