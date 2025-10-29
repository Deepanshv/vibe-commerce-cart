import axios from "axios";

// Create a single, configured "instance" of axios
const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

// All API functions are exported from here
export const fetchProducts = () => {
  return api.get("/products");
};

export const fetchCart = () => {
  return api.get("/cart");
};

export const addProductToCart = (productId, qty = 1) => {
  return api.post("/cart", { productId, qty });
};

export const updateCartItemQuantity = (cartItemId, qty) => {
  return api.put(`/cart/${cartItemId}`, { qty });
};

export const removeProductFromCart = (cartItemId) => {
  return api.delete(`/cart/${cartItemId}`);
};

export const checkout = (cartItems, customerDetails) => {
  return api.post("/checkout", { cartItems, customer: customerDetails });
};
