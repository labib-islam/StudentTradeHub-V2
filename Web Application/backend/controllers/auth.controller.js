import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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

    // create and save new user to the DB
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // sign the token
    const token = jwt.sign(
      {
        userId: savedUser._id,
        userEmail: savedUser.email,
      },
      process.env.JWT_SECRET
    );

    res.send({ token });
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

    // Password Varification
    const verifyPassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!verifyPassword)
      return res.status(401).json({ message: "Wrong email or password" });

    // sign the token
    const token = jwt.sign(
      {
        userId: existingUser._id,
        userEmail: existingUser.email,
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
    console.log('Decoded token:', decoded);
    const existingUser = await User.findOne({ email: decoded.userEmail }).select("+password");

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(existingUser);
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export default { signup, login, logout, getCurrentUser };
