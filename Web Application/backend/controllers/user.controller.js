import User from "../models/user.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import bcrypt from "bcrypt";

const buildSafePaymentSnapshot = (payment) => {
  if (!payment) return null;
  const { cardHolderName, cardNumber, expiryDate, type } = payment;
  if (!cardHolderName || !cardNumber || !expiryDate || !type) return null;

  return {
    cardHolderName,
    last4: cardNumber.slice(-4),
    expiryDate,
    type,
  };
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").populate("productList");
    res.status(200).json(users);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

// Get a single user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-password")
      .populate("productList");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error("Error fetching user:", err.message);
    res.status(500).json({ message: "Failed to fetch user." });
  }
};

// Update user information
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, password, currentPassword } = req.body;

    // Check if the user is authorized to update this profile
    if (req.userData.userId !== id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to update this user." });
    }

    // Find the user (include password field for verification if needed)
    const user = await User.findById(id).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Prepare update data
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({
          message: "Email is already in use by another account.",
        });
      }
      updateData.email = email;
    }

    // Handle password change
    if (password) {
      // Verify current password before allowing change
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required to change password.",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          message: "Current password is incorrect.",
        });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);
      updateData.password = hashedPassword;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error updating user:", err.message);
    res.status(500).json({ message: "Failed to update user." });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user is authorized to delete this profile
    if (req.userData.userId !== id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this user." });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      message: "User deleted successfully.",
    });
  } catch (err) {
    console.error("Error deleting user:", err.message);
    res.status(500).json({ message: "Failed to delete user." });
  }
};

// Search users by name or email
const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required." });
    }

    const users = await User.find({
      $or: [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    })
      .select("-password")
      .limit(10);

    res.status(200).json(users);
  } catch (err) {
    console.error("Error searching users:", err.message);
    res.status(500).json({ message: "Failed to search users." });
  }
};

// Add product to user's product list
const addProductToUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId } = req.body;

    // Check if the user is authorized
    if (req.userData.userId !== id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to modify this user." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if product already exists in the list
    if (user.productList.includes(productId)) {
      return res
        .status(400)
        .json({ message: "Product already in user's list." });
    }

    user.productList.push(productId);
    await user.save();

    const updatedUser = await User.findById(id)
      .select("-password")
      .populate("productList");

    res.status(200).json({
      message: "Product added to user successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error adding product to user:", err.message);
    res.status(500).json({ message: "Failed to add product to user." });
  }
};

// Remove product from user's product list
const removeProductFromUser = async (req, res) => {
  try {
    const { id, productId } = req.params;

    // Check if the user is authorized
    if (req.userData.userId !== id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to modify this user." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Remove product from list
    user.productList = user.productList.filter(
      (pid) => pid.toString() !== productId
    );
    await user.save();

    const updatedUser = await User.findById(id)
      .select("-password")
      .populate("productList");

    res.status(200).json({
      message: "Product removed from user successfully.",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Error removing product from user:", err.message);
    res.status(500).json({ message: "Failed to remove product from user." });
  }
};

const addPaymentMethod = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.paymentMethod = req.body;
    const snapshot = buildSafePaymentSnapshot(req.body);
    if (snapshot) {
      user.defaultPaymentMethod = snapshot;
    }
    await user.save();

    res.status(201).json({
      message: "Payment method added",
      data: user.defaultPaymentMethod,
    });
  } catch (err) {
    console.error("Failed to add payment method", err.message);
    res
      .status(500)
      .json({ message: "Failed to add payment method", error: err.message });
  }
};

const getUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({
      paymentMethod: user.defaultPaymentMethod || null,
      deliveryAddress: user.defaultDeliveryAddress || null,
      pickupAddress: user.pickupAddress || null,
    });
  } catch (err) {
    console.error("Failed to fetch preferences:", err.message);
    res.status(500).json({ message: "Failed to fetch preferences." });
  }
};

const updateUserPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { paymentMethod, deliveryAddress, pickupAddress } = req.body;

    if (paymentMethod) {
      const snapshot = buildSafePaymentSnapshot(paymentMethod);
      if (!snapshot) {
        return res.status(400).json({ message: "Invalid payment method data." });
      }
      user.defaultPaymentMethod = snapshot;
    }

    if (deliveryAddress) {
      user.defaultDeliveryAddress = deliveryAddress;
    }

    if (pickupAddress) {
      user.pickupAddress = pickupAddress;
    }

    await user.save();

    res.status(200).json({
      message: "Preferences updated successfully.",
      preferences: {
        paymentMethod: user.defaultPaymentMethod || null,
        deliveryAddress: user.defaultDeliveryAddress || null,
        pickupAddress: user.pickupAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to update preferences:", err.message);
    res.status(500).json({ message: "Failed to update preferences." });
  }
};

// Admin: get activity summary for a specific user
const getUserActivitySummary = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select("productList");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const [boughtCount, soldCount] = await Promise.all([
      Order.countDocuments({ buyer: id }),
      Order.countDocuments({ seller: id }),
    ]);

    const productCount = Array.isArray(user.productList)
      ? user.productList.length
      : 0;

    res.status(200).json({
      productCount,
      boughtCount,
      soldCount,
    });
  } catch (err) {
    console.error("Error fetching user activity summary:", err.message);
    res.status(500).json({ message: "Failed to fetch user activity." });
  }
};

// Admin: update user status (active/blocked)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "blocked"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Invalid status. Must be 'active' or 'blocked'." });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // When a user is blocked, set all their products to inactive
    if (status === "blocked") {
      await Product.updateMany(
        { createdBy: id, status: { $ne: "inactive" } },
        { status: "inactive" }
      );
    }

    res.status(200).json({
      message: "User status updated successfully.",
      user,
    });
  } catch (err) {
    console.error("Error updating user status:", err.message);
    res.status(500).json({ message: "Failed to update user status." });
  }
};

export default {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
  addProductToUser,
  removeProductFromUser,
  addPaymentMethod,
  getUserPreferences,
  updateUserPreferences,
  getUserActivitySummary,
  updateUserStatus,
};
