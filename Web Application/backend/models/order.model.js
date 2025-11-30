import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false }
);

const paymentSnapshotSchema = new mongoose.Schema(
  {
    cardHolderName: { type: String, required: true },
    last4: { type: String, required: true },
    expiryDate: { type: String, required: true },
    type: { type: String, enum: ["Credit", "Debit"], required: true },
  },
  { _id: false }
);

const deliveryDetailsSchema = new mongoose.Schema(
  {
    pickupAddress: addressSchema,
    shippingAddress: addressSchema,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values, but enforces uniqueness for non-null values
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    fulfillmentStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "ready_for_pickup",
        "out_for_delivery",
        "delivered",
        "picked_up",
        "cancelled",
      ],
      default: "pending",
    },
    deliveryType: {
      type: String,
      enum: ["pickup", "deliver"],
      required: true,
    },
    deliveryDetails: deliveryDetailsSchema,
    paymentMethod: paymentSnapshotSchema,
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;

