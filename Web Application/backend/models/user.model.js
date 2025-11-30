import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema(
  {
    cardHolderName: { type: String, required: true },
    cardNumber: { type: String, required: true },
    expiryDate: { type: String, required: true },
    cvv: { type: String, required: true, select: false },
    type: { type: String, enum: ["Credit", "Debit"], required: true },
  },
  { _id: false }
);

const safePaymentMethodSchema = new mongoose.Schema(
  {
    cardHolderName: { type: String, required: true },
    last4: { type: String, required: true },
    expiryDate: { type: String, required: true },
    type: { type: String, enum: ["Credit", "Debit"], required: true },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true, default: "Canada" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[\w\.-]+@mun\.ca$/,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    // Legacy payment method storage (still used by /payment/add endpoint)
    paymentMethod: paymentMethodSchema,
    defaultPaymentMethod: safePaymentMethodSchema,
    defaultDeliveryAddress: addressSchema,
    pickupAddress: addressSchema,
    productList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);
export default User;
