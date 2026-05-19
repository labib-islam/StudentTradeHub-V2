import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendPasswordResetEmail, sendVerificationEmail } from "../utils/email.util.js";

// Signup
const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check for empty fields
    if (!firstName || !lastName || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please enter all required fields." });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "An account with this email exists.",
      });
    }

    // hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving to database
    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // create and save new user to the DB (not verified yet)
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: Date.now() + 86400000, // 24 hours
    });

    const savedUser = await newUser.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(email, verificationToken);

    if (!emailResult.success) {
      // If email fails, delete the user and return error
      await User.findByIdAndDelete(savedUser._id);
      return res.status(500).json({
        message: "Error sending verification email. Please try again later."
      });
    }

    res.status(201).json({
      message: "Account created successfully! Please check your email to verify your account before logging in.",
      email: email
    });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for empty fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please enter all required fields." });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email }).select("+password");
    if (!existingUser)
      return res.status(401).json({ message: "Wrong email or password" });

    // Check if email is verified
    if (!existingUser.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in. Check your inbox for the verification link."
      });
    }

    // Password Varification
    const verifyPassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!verifyPassword)
      return res.status(401).json({ message: "Wrong email or password" });

    // Blocked users cannot log in
    if (existingUser.status === "blocked") {
      return res
        .status(403)
        .json({ message: "Your account has been blocked. Please contact support." });
    }

    // sign the token (include role)
    const token = jwt.sign(
      {
        userId: existingUser._id,
        userEmail: existingUser.email,
        role: existingUser.role,
      },
      process.env.JWT_SECRET
    );

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).send();
  }
};

// Logout
const logout = async (req, res) => {
  try {
    res.send("logout");
  } catch (err) {
    console.error("test error msg");
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const existingUser = await User.findOne({ email: decoded.userEmail }).select("+password");

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(existingUser);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Forgot Password - Send reset email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide an email address." });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving to database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token and expiry to user
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send email
    const emailResult = await sendPasswordResetEmail(email, resetToken);

    if (!emailResult.success) {
      return res.status(500).json({
        message: "Error sending email. Please try again later."
      });
    }

    res.status(200).json({
      message: "If an account with that email exists, a password reset link has been sent."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Reset Password - Update password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Please provide a token and new password."
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long."
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token and not expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset token."
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Password has been reset successfully. You can now log in with your new password."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Verify Email - Confirm email with token
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required."
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token and not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification token."
      });
    }

    // Update user to verified and clear verification fields
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully! You can now log in to your account."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

export default { signup, login, logout, getCurrentUser, forgotPassword, resetPassword, verifyEmail };
