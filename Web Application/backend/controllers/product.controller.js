import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, quantity, status } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Product image is required" });
    }

    // Create new product
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      quantity,
      imageUrl: req.file.path,
      status,
      createdBy: req.userData.userId,
    });

    // Associate product with user
    const user = await User.findById(req.userData.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newProduct.save({ session: sess });
    user.productList.push(newProduct._id);
    await user.save({ session: sess });
    await sess.commitTransaction();

    return res.status(201).json({ product: newProduct });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: err.message });
  }
};

const getAllProducts = async (req, res) => {
  const search = req.query.search;
  const category = req.query.cat;
  const status = req.query.status;

  try {
    const filter = {
      ...(status && status !== "all" && { status }), // filter by status if applicable
      ...(category && category !== "all" && { category }), // filter by category
      ...(search && { name: { $regex: search, $options: "i" } }), // case-insensitive search in product name
    };

    if (status === "all") {
      filter.status = { $ne: "draft" }; // exclude "draft"
    }

    const products = await Product.find(filter).populate(
      "createdBy",
      "email imageUrl"
    );

    return res.json({ products });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).send();
  }
};

const getProductById = async (req, res) => {
  const pid = req.params.pid;

  try {
    const product = await Product.findById(pid).populate(
      "createdBy",
      "email imageUrl"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const isActive = product.status === "active"; // if you have status
    const notDraft = product.status !== "draft"; // if you have draft logic
    const isCreator = product.createdBy._id.toString() === req.userData.userId;
    const isAdmin = req.userData.role === "admin";

    if (isActive || isCreator || (isAdmin && notDraft)) {
      return res.json({ product });
    }

    return res
      .status(403)
      .json({ message: "You are not authorized to view this product." });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).send();
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, quantity } = req.body;
    const pid = req.params.pid;

    const product = await Product.findById(pid);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Only the creator can update
    const isCreator = product.createdBy.toString() === req.userData.userId;

    if (!isCreator) {
      return res
        .status(401)
        .json({ message: "You are not allowed to edit this product." });
    }

    // Update product fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (quantity) product.quantity = quantity;

    await product.save();

    return res.json({ product });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).send();
  }
};

const deleteProduct = async (req, res) => {
  try {
    const pid = req.params.pid;

    const product = await Product.findById(pid).populate("createdBy");

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Only creator can delete
    const isCreator = product.createdBy._id.toString() === req.userData.userId;

    if (!isCreator) {
      return res
        .status(401)
        .json({ message: "You are not allowed to delete this product." });
    }

    const imagePath = product.imageUrl;

    const sess = await mongoose.startSession();
    sess.startTransaction();
    await product.deleteOne({ session: sess });

    // Optionally remove product from user's product list
    if (product.createdBy.productList) {
      product.createdBy.productList.pull(product._id);
      await product.createdBy.save({ session: sess });
    }

    await sess.commitTransaction();

    // Delete local image
    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlink(imagePath, (err) => {
        if (err) console.warn("Failed to delete image:", err.message);
      });
    }

    res.status(200).json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("Error deleting product:", err);
    res.status(500).send();
  }
};

export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
