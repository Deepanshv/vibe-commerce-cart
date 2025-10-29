import React, { useState } from "react";
import { formatCurrency } from "../utils";

function Checkout({ cart, onSubmit }) {
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert("Please fill out all fields.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="checkout-form">
      <h2>Checkout</h2>
      {/* UPDATED: Total is now formatted */}
      <p>
        You are about to purchase {cart.items.length} item(s) for a total of{" "}
        <strong>{formatCurrency(cart.total)}</strong>.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="submit-btn">
          Confirm Purchase
        </button>
      </form>
    </div>
  );
}

export default Checkout;
