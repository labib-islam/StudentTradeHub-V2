import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import Order from "../models/order.model.js";

const toNum = (v) => (v === undefined ? undefined : Number(v));
const toBool = (v) =>
  v === undefined ? undefined : ["true", "1", "yes"].includes(String(v).toLowerCase());
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, quantity, status, condition } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Product image is required" });
    }

    // Prevent creating products with inactive status
    if (status === "inactive") {
      return res
        .status(400)
        .json({ message: "Cannot create a product with inactive status. Use 'active' or 'draft'." });
    }

    // Only allow "active" or "draft" status, default to "active"
    const productStatus = status && ["active", "draft"].includes(status) ? status : "active";

    // Create new product
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      quantity,
      imageUrl: req.file.path,
      status: productStatus,
      condition,
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
  const {
    search,
    status,
    condition,
    minPrice,
    maxPrice,
    createdBy,
    inStock,
    sort,
    page = 1,
    limit = 12,
  } = req.query;

  const categoryParam = (req.query.category || req.query.cat || "").trim();

  try {
    const filter = {};

    if (status === "all") {
      filter.status = { $ne: "draft" };
    } else if (status) {
      filter.status = status;
    }


    if (categoryParam && categoryParam !== "all") {
      filter.category = { $regex: new RegExp(`^${escapeRegex(categoryParam)}$`, "i") };
    }

    if (condition && condition !== "all") {
      filter.condition = condition;
    }

    const minP = toNum(minPrice);
    const maxP = toNum(maxPrice);
    if (minP !== undefined || maxP !== undefined) {
      filter.price = {};
      if (!Number.isNaN(minP)) filter.price.$gte = minP;
      if (!Number.isNaN(maxP)) filter.price.$lte = maxP;
    }

    // if (createdBy) {
    //   filter.createdBy = createdBy;
    // } else if (req.userData?.userId) {
    //   // For authenticated users, hide their own products from the general list
    //   filter.createdBy = { $ne: req.userData.userId };
    // }

    const inStockBool = toBool(inStock);
    if (inStockBool !== undefined) {
      filter.quantity = inStockBool ? { $gt: 0 } : { $lte: 0 };
    }

    if (search) {
      filter.name = { $regex: escapeRegex(search), $options: "i" };
    }

    const sortRaw = String(sort || "newest").trim();
    let sortOption;
    switch (sortRaw) {
      case "price":   sortOption = { price: 1 }; break;
      case "-price":  sortOption = { price: -1 }; break;
      case "name":    sortOption = { name: 1 }; break;
      case "-name":   sortOption = { name: -1 }; break;
      case "newest":
      default:        sortOption = { createdAt: -1 };
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .collation({ locale: "en", numericOrdering: true })
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .populate("createdBy", "firstName lastName email imageUrl")
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasNext: skip + products.length < total,
      },
    });
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
      "firstName lastName email imageUrl pickupAddress defaultDeliveryAddress"
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const isActive = product.status === "active";
    const isCreator =
      product.createdBy._id.toString() === req.userData?.userId;
    const isAdmin = req.userData?.role === "admin";

    // Allow viewing if product is active, user is creator, or admin
    if (isActive || isCreator || isAdmin) {
      return res.json({ product });
    }

    // For inactive or draft products, allow viewing if user has an order for this product
    if ((product.status === "inactive" || product.status === "draft") && req.userData?.userId) {
      const hasOrder = await Order.findOne({
        product: product._id,
        $or: [
          { buyer: req.userData.userId },
          { seller: req.userData.userId },
        ],
      });

      if (hasOrder) {
        return res.json({ product });
      }
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
    const { name, description, price, category, quantity, status, condition } = req.body;
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

    // Cannot edit inactive products (sold out)
    if (product.status === "inactive") {
      return res
        .status(400)
        .json({ message: "Cannot edit a product that is sold out." });
    }

    // Prevent setting status to inactive manually (only becomes inactive when quantity reaches 0)
    if (status && status === "inactive") {
      return res
        .status(400)
        .json({ message: "Status cannot be set to inactive. It becomes inactive automatically when sold out." });
    }

    // Only allow "active" or "draft" status
    if (status && !["active", "draft"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status can only be set to 'active' or 'draft'." });
    }

    // Update product fields
    if (name) product.name = name;
    if (description) product.description = description;
    if (price) product.price = price;
    if (category) product.category = category;
    if (quantity) product.quantity = quantity;
    if (condition) product.condition = condition; 
    if (status && ["active", "draft"].includes(status)) {
      product.status = status;
    }

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

    // Cannot delete inactive products (sold out)
    if (product.status === "inactive") {
      return res
        .status(400)
        .json({ message: "Cannot delete a product that is sold out." });
    }

    // Only creator can delete
    const isCreator = product.createdBy._id.toString() === req.userData.userId;
    console.log("Is Creator:", isCreator);

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

/** GET /api/products/suggest?q=xxx */
const suggestProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const suggestions = await Product.find(
      { name: { $regex: `^${escapeRegex(q)}`, $options: "i" } },
      { _id: 1, name: 1 }
    )
      .limit(10)
      .lean();

    res.json(suggestions);
  } catch (err) {
    console.error("Error suggesting products:", err);
    res.status(500).send();
  }
};

export default {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  suggestProducts,
};
