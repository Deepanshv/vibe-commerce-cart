import React, { useState, useEffect } from "react";
import * as api from "./api";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import Checkout from "./components/Checkout";
import Toast from "./components/Toast";
import { formatCurrency } from "./utils"; // Import our new formatter
import "./App.css";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: "0.00" });
  const [view, setView] = useState("products");
  const [checkoutReceipt, setCheckoutReceipt] = useState(null);
  const [error, setError] = useState(null);
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "" });

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const fetchProducts = async () => {
    setError(null);
    try {
      const response = await api.fetchProducts();
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products. Please try refreshing the page.");
    }
  };

  const fetchCart = async () => {
    setError(null);
    try {
      const response = await api.fetchCart();
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setError("Failed to fetch your cart. Please try again.");
    }
  };

  const handleAddToCart = async (productId, qty = 1) => {
    setError(null);
    setLoadingProductId(productId);

    try {
      await api.addProductToCart(productId, qty);
      await fetchCart();
      const product = products.find((p) => p.id === productId);
      showToast(`${product.name} added to cart!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError("Failed to add item to cart.");
    } finally {
      setLoadingProductId(null);
    }
  };

  const handleUpdateQuantity = async (cartItemId, qty) => {
    setError(null);
    try {
      await api.updateCartItemQuantity(cartItemId, qty);
      await fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      setError("Failed to update item quantity.");
    }
  };

  const handleRemoveFromCart = async (cartItemId) => {
    setError(null);
    try {
      await api.removeProductFromCart(cartItemId);
      await fetchCart();
      showToast(`Item removed from cart.`);
    } catch (error) {
      console.error("Error removing from cart:", error);
      setError("Failed to remove item from cart.");
    }
  };

  const handleCheckout = async (customerDetails) => {
    setError(null);
    try {
      const response = await api.checkout(cart.items, customerDetails);
      setCheckoutReceipt(response.data);
      setCart({ items: [], total: "0.00" });
      setView("products");
    } catch (error) {
      console.error("Error during checkout:", error);
      setError("Checkout failed. Please try again.");
    }
  };

  const showToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: "" });
    }, 3000);
  };

  const closeToast = () => {
    setToast({ show: false, message: "" });
  };

  return (
    <div className="App">
      <header>
        <h1>Vibe Commerce</h1>
        <nav>
          <button onClick={() => setView("products")}>Products</button>
          <button
            onClick={() => {
              setView("cart");
              fetchCart();
            }}
          >
            Cart ({cart.items.reduce((sum, item) => sum + item.qty, 0)})
          </button>
        </nav>
      </header>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {checkoutReceipt && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={() => setCheckoutReceipt(null)}>
              &times;
            </span>
            <h2>Checkout Successful!</h2>
            <p>
              <strong>Order ID:</strong> {checkoutReceipt.orderId}
            </p>
            {/* UPDATED: Total is now formatted */}
            <p>
              <strong>Total Paid:</strong>{" "}
              {formatCurrency(checkoutReceipt.total)}
            </p>
            <p>
              <strong>Timestamp:</strong>{" "}
              {new Date(checkoutReceipt.timestamp).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      <main>
        {view === "products" && (
          <ProductList
            products={products}
            onAddToCart={handleAddToCart}
            loadingProductId={loadingProductId}
          />
        )}

        {view === "cart" && (
          <Cart
            cart={cart}
            onRemove={handleRemoveFromCart}
            onUpdateQuantity={handleUpdateQuantity}
            onCheckout={() => setView("checkout")}
          />
        )}

        {view === "checkout" && (
          <Checkout cart={cart} onSubmit={handleCheckout} />
        )}
      </main>

      <Toast message={toast.message} show={toast.show} onClose={closeToast} />
    </div>
  );
}

export default App;
