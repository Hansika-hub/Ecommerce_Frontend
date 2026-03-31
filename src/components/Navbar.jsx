import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Navbar() {
  const { isLoggedIn, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link to="/products" className="navbar-logo">
          <span className="logo-icon">⬡</span> ShopWave
        </Link>

        {/* Hamburger for mobile */}
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>

        {/* Nav links */}
        <div className={`navbar-links ${menuOpen ? "open" : ""}`}>
          <Link to="/products" onClick={() => setMenuOpen(false)}>Products</Link>

          {isLoggedIn && !isAdmin && (
            <>
              <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart</Link>
              <Link to="/orders" onClick={() => setMenuOpen(false)}>My Orders</Link>
            </>
          )}

          {isAdmin && (
            <Link to="/admin" className="admin-badge" onClick={() => setMenuOpen(false)}>
              Admin Dashboard
            </Link>
          )}

          {isLoggedIn ? (
            <div className="navbar-user">
              <span className="user-email">{user?.email}</span>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <div className="navbar-auth">
              <Link to="/login" className="btn-nav-outline" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn-nav-fill" onClick={() => setMenuOpen(false)}>
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
