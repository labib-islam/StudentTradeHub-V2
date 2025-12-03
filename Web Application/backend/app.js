import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/products.routes.js";
import userRoutes from "./routes/user.routes.js";
import orderRoutes from "./routes/order.routes.js";
import reviewRoutes from "./routes/review.routes.js";

// Load environment variables
dotenv.config();

// Set NODE_ENV to test if not already set (for test environment)
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

// Server Setup
const app = express();
const port = process.env.PORT || 8800;

// Allow requests from frontend
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true, // allow cookies
  })
);

// Connect to Database [MongoDB] only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(
      `mongodb+srv://nafiurr_db_user:${process.env.DB_PASSWORD}@cluster0.7vcu4dk.mongodb.net/?appName=Cluster0`
    )
    .then(() => {
      app.listen(port);
      console.log("Connected to Database");
    })
    .catch((err) => {
      console.log(err);
    });
}

// Middleware: To parse incoming JSON request
app.use(express.json());
// Middleware: To serve static files
app.use("/public/images", express.static(path.join("public", "images")));

// Routes
app.get("/", (req, res) => res.send("Student-Tradehub"));
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

// handle undefined paths (404 Not Found)
app.use((req, res, next) => {
  res.status(404).json({ message: "The requested path was not found." });
});

export default app;
