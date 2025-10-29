const express = require("express");
const cors = require("cors");
const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
const PORT = process.env.PORT || 5001;
const MOCK_USER_ID = 1;

let db;

async function setupDatabase() {
  try {
    // Use in-memory SQLite for render.com deployment
    db = await sqlite.open({
      filename:
        process.env.NODE_ENV === "production" ? ":memory:" : "vibe-commerce.db",
      driver: sqlite3.Database,
    });

    // UPDATED: Added imageUrl column
    await db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        imageUrl TEXT NOT NULL DEFAULT ''
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS cart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        productId INTEGER NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        qty INTEGER NOT NULL,
        FOREIGN KEY(productId) REFERENCES products(id)
      );
    `);

    const productCount = await db.get("SELECT COUNT(*) as count FROM products");
    if (productCount.count === 0) {
      console.log("Seeding database with initial products...");
      const seedProducts = [
        {
          name: "Classic Tee",
          price: 2499,
          imageUrl:
            "https://storage.googleapis.com/gemini-dev-resources/ecom-a/tee.jpg",
        },
        {
          name: "Leather Jacket",
          price: 14999,
          imageUrl:
            "https://storage.googleapis.com/gemini-dev-resources/ecom-a/jacket.jpg",
        },
        {
          name: "Slim-Fit Jeans",
          price: 4999,
          imageUrl:
            "https://storage.googleapis.com/gemini-dev-resources/ecom-a/jeans.jpg",
        },
        {
          name: "Running Shoes",
          price: 7999,
          imageUrl:
            "https://storage.googleapis.com/gemini-dev-resources/ecom-a/shoes.jpg",
        },
        {
          name: "Beanie Hat",
          price: 1499,
          imageUrl:
            "https://storage.googleapis.com/gemini-dev-resources/ecom-a/beanie.jpg",
        },
      ];
      const stmt = await db.prepare(
        "INSERT INTO products (name, price, imageUrl) VALUES (?, ?, ?)"
      );
      for (const product of seedProducts) {
        await stmt.run(product.name, product.price, product.imageUrl);
      }
      await stmt.finalize();
      console.log("Database seeded!");
    }
  } catch (error) {
    console.error("Error setting up database:", error);
    process.exit(1);
  }
}

// Configure CORS with specific options
app.use(
  cors({
    origin: [
      "https://vibe-commerce-cart-5v56wotwn-deepanshvs-projects.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());

// GET /api/products
app.get("/api/products", async (req, res, next) => {
  try {
    const products = await db.all("SELECT * FROM products");
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// GET /api/cart
app.get("/api/cart", async (req, res, next) => {
  try {
    const cartItems = await db.all("SELECT * FROM cart WHERE userId = ?", [
      MOCK_USER_ID,
    ]);
    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    res.json({ items: cartItems, total: total.toFixed(2) });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart
app.post("/api/cart", async (req, res, next) => {
  try {
    const { productId, qty } = req.body;
    const product = await db.get("SELECT * FROM products WHERE id = ?", [
      productId,
    ]);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    const existingCartItem = await db.get(
      "SELECT * FROM cart WHERE productId = ? AND userId = ?",
      [productId, MOCK_USER_ID]
    );
    if (existingCartItem) {
      await db.run("UPDATE cart SET qty = qty + ? WHERE id = ?", [
        qty,
        existingCartItem.id,
      ]);
      const updatedItem = await db.get("SELECT * FROM cart WHERE id = ?", [
        existingCartItem.id,
      ]);
      res.status(200).json(updatedItem);
    } else {
      const result = await db.run(
        "INSERT INTO cart (userId, productId, name, price, qty) VALUES (?, ?, ?, ?, ?)",
        [MOCK_USER_ID, product.id, product.name, product.price, qty]
      );
      const newItem = await db.get("SELECT * FROM cart WHERE id = ?", [
        result.lastID,
      ]);
      res.status(201).json(newItem);
    }
  } catch (error) {
    next(error);
  }
});

// === 🚀 NEW ENDPOINT: PUT /api/cart/:id ===
// Used to update the quantity of a specific item
app.put("/api/cart/:id", async (req, res, next) => {
  try {
    const cartItemId = parseInt(req.params.id);
    const { qty } = req.body;

    if (qty <= 0) {
      // If quantity is 0 or less, remove the item
      await db.run("DELETE FROM cart WHERE id = ? AND userId = ?", [
        cartItemId,
        MOCK_USER_ID,
      ]);
      return res.status(204).send(); // No Content
    } else {
      // Otherwise, update the quantity
      const result = await db.run(
        "UPDATE cart SET qty = ? WHERE id = ? AND userId = ?",
        [qty, cartItemId, MOCK_USER_ID]
      );
      if (result.changes === 0) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      const updatedItem = await db.get("SELECT * FROM cart WHERE id = ?", [
        cartItemId,
      ]);
      res.status(200).json(updatedItem);
    }
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/:id
app.delete("/api/cart/:id", async (req, res, next) => {
  try {
    const cartItemId = parseInt(req.params.id);
    const result = await db.run(
      "DELETE FROM cart WHERE id = ? AND userId = ?",
      [cartItemId, MOCK_USER_ID]
    );
    if (result.changes === 0) {
      return res.status(404).json({ message: "Cart item not found" });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/checkout
app.post("/api/checkout", async (req, res, next) => {
  try {
    const { cartItems } = req.body;
    if (!cartItems || cartItems.length === 0) {
      return res
        .status(400)
        .json({ message: "Cannot checkout with an empty cart" });
    }
    const total = cartItems.reduce(
      (sum, item) => sum + item.price * item.qty,
      0
    );
    await db.run("DELETE FROM cart WHERE userId = ?", [MOCK_USER_ID]);
    const receipt = {
      orderId: `VIBE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      total: total.toFixed(2),
      itemCount: cartItems.length,
    };
    res.status(200).json(receipt);
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "An internal server error occurred.",
    error: err.message,
  });
});

// Log environment configuration
console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
console.log("Setting up database...");
console.log(
  `Database: ${
    process.env.NODE_ENV === "production"
      ? "In-Memory SQLite"
      : "Local SQLite File"
  }`
);

setupDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
      console.log("CORS enabled for:", [
        "https://vibe-commerce-cart.vercel.app",
        "http://localhost:3000",
      ]);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
  });
