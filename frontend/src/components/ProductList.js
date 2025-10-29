import React from "react";
import { formatCurrency } from "../utils";

function ProductList({ products, onAddToCart, loadingProductId }) {
  const handleAddToCartClick = (productId) => {
    if (loadingProductId) return;
    onAddToCart(productId, 1);
  };

  return (
    <div className="products-section">
      <h2>Products</h2>
      <div className="product-grid">
        {products.map((product) => {
          const isLoading = product.id === loadingProductId;

          return (
            <div key={product.id} className="product-card">
              <h3>{product.name}</h3>
              <p className="price">{formatCurrency(product.price)}</p>
              <button
                onClick={() => handleAddToCartClick(product.id)}
                className={`add-to-cart-btn ${isLoading ? "is-loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProductList;
