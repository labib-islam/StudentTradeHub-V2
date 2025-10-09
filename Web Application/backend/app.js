import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";

// Load environment variables
dotenv.config()

// Server Setup
const app = express()
const port = process.env.PORT || 8800;

// Allow requests from frontend
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true, // allow cookies
  })
);


// Connect to Database [MongoDB]
mongoose
  .connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.we8cyvi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
  .then(() => {
    app.listen(port);
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log(err);
  });


// Middleware: To parse incoming JSON request
app.use(express.json());

// Routes
app.get("/", (req, res) => res.send("Student-Tradehub"));
app.use('/api/auth', authRoutes)

// handle undefined paths (404 Not Found)
app.use((req, res, next) => {
  res.status(404).json({ message: "The requested path was not found." });
});