import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [cartMsg, setCartMsg] = useState("");
  const [selectedVariants, setSelectedVariants] = useState({});
  const { isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axiosInstance.get("/api/products/public/all");
        setProducts(res.data);
        setFiltered(res.data);

        // Extract embedded category names
        const cats = ["All", ...new Set(res.data.map((p) => p.category?.categoryName).filter(Boolean))];
        setCategories(cats);

        // Setup initial default variants for dropdown
        const initVariants = {};
        res.data.forEach(p => {
          if (p.variants && p.variants.length > 0) {
            initVariants[p.id] = p.variants[0].variantId;
          }
        });
        setSelectedVariants(initVariants);

      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    if (category !== "All") {
      result = result.filter((p) => p.category?.categoryName === category);
    }
    if (search.trim()) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  }, [search, category, products]);

  const addToCart = (product) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const variantId = selectedVariants[product.id];
    if (!variantId) {
      setCartMsg("Please select a valid variant.");
      return;
    }

    const variant = product.variants.find(v => v.variantId === variantId);

    // Read from localStorage Cart
    const currentCart = JSON.parse(localStorage.getItem("shopwave_cart") || "[]");

    const existingIndex = currentCart.findIndex(item => item.productId === product.id && item.variantId === variantId);
    if (existingIndex > -1) {
      if (currentCart[existingIndex].qty + 1 > variant.stock) {
        setCartMsg("Cannot add more than available stock!");
        setTimeout(() => setCartMsg(""), 2000);
        return;
      }
      currentCart[existingIndex].qty += 1;
    } else {
      currentCart.push({
        productId: product.id,
        productName: product.name,
        variantId: variant.variantId,
        color: variant.color,
        size: variant.size,
        qty: 1,
        priceAtPurchase: variant.price || 0,
        imageUrl: product.images && product.images.length > 0 ? product.images[0] : null
      });
    }

    localStorage.setItem("shopwave_cart", JSON.stringify(currentCart));

    setCartMsg("Added to cart!");
    setTimeout(() => setCartMsg(""), 2000);
  };

  const handleVariantChange = (productId, variantId) => {
    setSelectedVariants(prev => ({ ...prev, [productId]: variantId }));
  };

  if (loading) {
    return (
      <div className="page-center">
        <div className="loading-spinner" />
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="page">
      {cartMsg && <div className="toast">{cartMsg}</div>}

      <div className="page-header">
        <h1>Products</h1>
        <p>{filtered.length} items available</p>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`cat-tab ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No products found.</p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map((product) => {
            const currentVariantId = selectedVariants[product.id];
            const currentVariant = product.variants?.find(v => v.variantId === currentVariantId);
            const displayPrice = currentVariant ? currentVariant.price : 0;

            return (
              <div key={product.id} className="product-card">
                <div className="product-img">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }} />
                  ) : null}
                  <div className="product-img-placeholder" style={{ display: product.images?.[0] ? "none" : "flex" }}>
                    {product.name?.charAt(0)}
                  </div>
                </div>

                <div className="product-body">
                  <span className="product-category">{product.category?.categoryName || "General"}</span>
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-desc">
                    {product.description?.slice(0, 60)}
                    {product.description?.length > 60 ? "..." : ""}
                  </p>

                  {product.variants && product.variants.length > 0 && (
                    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                      <select
                        value={currentVariantId || ""}
                        onChange={(e) => handleVariantChange(product.id, e.target.value)}
                        style={{ padding: '5px', width: '100%', borderRadius: '4px', border: '1px solid #ddd' }}
                      >
                        {product.variants.map(v => (
                          <option key={v.variantId} value={v.variantId}>
                            {v.color} - {v.size} ({v.stock} left)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="product-footer">
                    <span className="product-price">₹{displayPrice.toLocaleString("en-IN")}</span>
                    <span className={`stock-badge ${(!currentVariant || currentVariant.stock === 0) ? "out" : ""}`}>
                      {(!currentVariant || currentVariant.stock === 0) ? "Out of stock" : `${currentVariant.stock} in stock`}
                    </span>
                  </div>

                  {!isAdmin && (
                    <button
                      className="btn-add-cart"
                      onClick={() => addToCart(product)}
                      disabled={!currentVariant || currentVariant.stock === 0}
                    >
                      {!currentVariant || currentVariant.stock === 0 ? "Out of Stock" : "Add to Cart"}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
