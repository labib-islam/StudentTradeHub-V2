import mongoose from "mongoose";

const paymentMethodSchema = new mongoose.Schema({
  cardHolderName: { type: String, required: true },
  cardNumber: { type: String, required: true },
  expiryDate: { type: String, required: true },
  cvv: { type: String, required: true, select: false },
  type: { type: String, enum: ["Credit", "Debit"], required: true },
});

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
    paymentMethod: paymentMethodSchema,
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
