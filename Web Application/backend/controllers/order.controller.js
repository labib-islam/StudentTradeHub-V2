import mongoose from "mongoose";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

const buildPaymentSnapshot = (payment) => {
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

const getStatusPipeline = (deliveryType) => {
  if (deliveryType === "pickup") {
    return ["pending", "ready_for_pickup", "picked_up"];
  }
  return ["pending", "confirmed", "out_for_delivery", "delivered"];
};

const generateOrderNumber = () => {
  // Generate unique order number: ORD-YYYYMMDD-HHMMSS-XXXX
  // Uses timestamp + milliseconds + random string for uniqueness
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, "");
  const ms = now.getMilliseconds().toString().padStart(3, "0");
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${dateStr}-${timeStr}${ms}-${randomStr}`;
};

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const buyerId = req.userData.userId;
    const {
      productId,
      quantity: requestedQuantity,
      paymentMethod,
      deliveryOption,
      savePaymentMethod,
      saveDeliveryAddress,
    } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product is required." });
    }

    const quantity = parseInt(requestedQuantity, 10);
    if (isNaN(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Valid quantity is required." });
    }

    const buyer = await User.findById(buyerId).session(session);
    if (!buyer) {
      return res.status(404).json({ message: "Buyer account not found." });
    }

    const product = await Product.findById(productId)
      .populate("createdBy")
      .session(session);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    if (product.createdBy._id.toString() === buyerId) {
      return res
        .status(400)
        .json({ message: "You cannot purchase your own listing." });
    }

    if (product.quantity <= 0) {
      return res
        .status(400)
        .json({ message: "This product is currently out of stock." });
    }

    if (quantity > product.quantity) {
      return res
        .status(400)
        .json({ 
          message: `Only ${product.quantity} item(s) available. Requested: ${quantity}.` 
        });
    }

    const seller = await User.findById(product.createdBy._id).session(session);
    const deliveryType =
      deliveryOption?.type === "deliver" ? "deliver" : "pickup";

    const paymentSnapshot =
      buildPaymentSnapshot(paymentMethod) ||
      buyer.defaultPaymentMethod ||
      null;

    if (!paymentSnapshot) {
      return res.status(400).json({
        message: "Payment method is required to place an order.",
      });
    }

    let pickupAddress;
    let shippingAddress;

    if (deliveryType === "pickup") {
      pickupAddress =
        seller?.pickupAddress || seller?.defaultDeliveryAddress || null;
      if (!pickupAddress) {
        return res.status(400).json({
          message: "Seller has not provided a pickup location yet.",
        });
      }
    } else {
      shippingAddress =
        deliveryOption?.address || buyer.defaultDeliveryAddress || null;
      if (!shippingAddress || !shippingAddress.line1) {
        return res.status(400).json({
          message: "A delivery address is required for this order.",
        });
      }
    }

    let newOrder;
    await session.withTransaction(async () => {
      product.quantity -= quantity;
      
      // Set product status to inactive if quantity becomes 0
      if (product.quantity === 0) {
        product.status = "inactive";
      }
      
      await product.save({ session });

      const totalAmount = product.price * quantity;

      newOrder = await Order.create(
        [
          {
            orderNumber: generateOrderNumber(),
            product: product._id,
            seller: seller?._id || product.createdBy._id,
            buyer: buyer._id,
            quantity: quantity,
            amount: totalAmount,
            paymentStatus: "paid",
            fulfillmentStatus: "pending",
            deliveryType,
            deliveryDetails: {
              pickupAddress,
              shippingAddress,
            },
            paymentMethod: paymentSnapshot,
          },
        ],
        { session }
      );

      if (savePaymentMethod && paymentMethod) {
        buyer.defaultPaymentMethod = paymentSnapshot;
        buyer.paymentMethod = paymentMethod;
      }

      if (saveDeliveryAddress && shippingAddress) {
        buyer.defaultDeliveryAddress = shippingAddress;
      }

      await buyer.save({ session });
    });

    res.status(201).json({
      message: "Order placed successfully.",
      order: newOrder?.[0],
    });
  } catch (err) {
    console.error("Failed to create order:", err.message);
    res.status(500).json({ message: "Failed to create order." });
  } finally {
    session.endSession();
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("product")
      .populate("buyer", "firstName lastName email")
      .populate("seller", "firstName lastName email sellerRating");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    if (
      order.buyer._id.toString() !== req.userData.userId &&
      order.seller._id.toString() !== req.userData.userId
    ) {
      return res.status(403).json({ message: "Access denied." });
    }

    res.status(200).json({ order });
  } catch (err) {
    console.error("Failed to fetch order:", err.message);
    res.status(500).json({ message: "Failed to fetch order." });
  }
};

const getOrdersForUser = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const role = (req.query.role || "buyer").toString();

    const filter =
      role === "seller" ? { seller: userId } : { buyer: userId };

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("product")
      .populate("buyer", "firstName lastName email")
      .populate("seller", "firstName lastName email sellerRating");

    res.status(200).json({ orders });
  } catch (err) {
    console.error("Failed to fetch orders:", err.message);
    res.status(500).json({ message: "Failed to fetch orders." });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const userId = req.userData.userId;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res
        .status(400)
        .json({ message: "New status is required to update order." });
    }

    const order = await Order.findById(id)
      .populate("buyer", "firstName lastName email")
      .populate("seller", "firstName lastName email sellerRating");

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    // Only seller can update status
    if (order.seller._id.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Only the seller can update the order status." });
    }

    const pipeline = getStatusPipeline(order.deliveryType);

    // Allow cancellation only from pending
    if (status === "cancelled") {
      if (order.fulfillmentStatus !== "pending") {
        return res.status(400).json({
          message: "Order can only be cancelled when pending.",
        });
      }
      order.fulfillmentStatus = "cancelled";
      await order.save();
      return res.status(200).json({ order });
    }

    if (!pipeline.includes(status)) {
      return res.status(400).json({ message: "Invalid status for this order." });
    }

    const currentIndex = pipeline.indexOf(order.fulfillmentStatus);
    const nextIndex = pipeline.indexOf(status);

    if (nextIndex === -1 || nextIndex <= currentIndex) {
      return res.status(400).json({
        message: "Status can only move forward in the delivery pipeline.",
      });
    }

    order.fulfillmentStatus = status;
    await order.save();

    res.status(200).json({ order });
  } catch (err) {
    console.error("Failed to update order status:", err.message);
    res.status(500).json({ message: "Failed to update order status." });
  }
};

// Admin: Get orders for a specific user (buyer or seller)
const getOrdersForUserAdmin = async (req, res) => {
  try {
    const { id } = req.params; // User ID from URL params
    const role = (req.query.role || "buyer").toString(); // Filter by buyer or seller role

    const filter = role === "seller" ? { seller: id } : { buyer: id };

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate("product")
      .populate("buyer", "firstName lastName email")
      .populate("seller", "firstName lastName email");

    res.status(200).json({ orders });
  } catch (err) {
    console.error("Failed to fetch orders for user (admin):", err.message);
    res.status(500).json({ message: "Failed to fetch orders for user." });
  }
};

export default {
  createOrder,
  getOrderById,
  getOrdersForUser,
  updateOrderStatus,
  getOrdersForUserAdmin,
};

