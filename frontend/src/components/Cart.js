import React from "react";
import { formatCurrency } from "../utils";

function Cart({ cart, onRemove, onUpdateQuantity, onCheckout }) {
  const handleQtyChange = (item, newQty) => {
    // Don't allow quantities above 99
    if (newQty <= 0) {
      onRemove(item.id);
    } else if (newQty <= 99) {
      onUpdateQuantity(item.id, newQty);
    }
  };

  return (
    <div className="cart-view">
      <h2>Shopping Cart</h2>
      {cart.items.length === 0 ? (
        <div className="empty-cart">
          <i className="fas fa-shopping-cart"></i>
          <p>Your cart is empty</p>
          <p className="empty-cart-subtext">
            Add items to your cart to get started!
          </p>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.id} className="cart-item">
                <span className="item-name">{item.name}</span>
                <span className="item-price">{formatCurrency(item.price)}</span>
                <div className="cart-item-controls">
                  <button
                    className="qty-btn minus"
                    onClick={() => handleQtyChange(item, item.qty - 1)}
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="qty-display">{item.qty}</span>
                  <button
                    className="qty-btn plus"
                    onClick={() => handleQtyChange(item, item.qty + 1)}
                    aria-label="Increase quantity"
                    disabled={item.qty >= 99}
                  >
                    +
                  </button>
                </div>
                <div className="item-subtotal">
                  {formatCurrency(item.price * item.qty)}
                  <button
                    className="cart-item-remove-btn"
                    onClick={() => onRemove(item.id)}
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-total">
              <span>Total</span>
              <strong>{formatCurrency(cart.total)}</strong>
            </div>
            <button
              className="checkout-btn"
              onClick={onCheckout}
              aria-label="Proceed to checkout"
            >
              Proceed to Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Cart;
