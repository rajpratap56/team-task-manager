const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// 🔐 Token generator (with safety check)
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ✅ SIGNUP
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Debug log (optional)
    console.log("📥 Signup Body:", req.body);

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email is already registered",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "member",
    });

    // Generate token
    const token = generateToken(user._id);

    return res.status(201).json({
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("🔥 Signup Error:", error);
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

// ✅ LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("📥 Login Body:", req.body);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("🔥 Login Error:", error);
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

// ✅ GET CURRENT USER
const me = async (req, res) => {
  try {
    return res.json({ user: req.user });
  } catch (error) {
    console.error("🔥 Me Error:", error);
    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  signup,
  login,
  me,
};