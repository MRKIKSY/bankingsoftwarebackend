const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

const router = express.Router();

/**
 * ======================
 * REGISTER
 * ======================
 */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, address, signup_code, is_admin } = req.body;

    if (!username || !email || !password || !address || !signup_code) {
      return res.status(400).json({
        detail: "Missing required fields"
      });
    }

    // Check if username or email exists
    const exists = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (exists) {
      return res.status(400).json({
        detail: "Username or email already exists"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashedPassword,
      address,
      signup_code,              // ✅ ADDED
      is_admin: !!is_admin
    });

    return res.status(201).json({
      detail: "User created successfully"
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({
      detail: "Registration failed"
    });
  }
});

/**
 * ======================
 * LOGIN
 * ======================
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        detail: "Missing credentials"
      });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        detail: "Invalid username or password"
      });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        detail: "Invalid username or password"
      });
    }

    // Create JWT
    const token = jwt.sign(
      { sub: user.username, is_admin: user.is_admin },
      process.env.SECRET_KEY,
      { expiresIn: "1h" }
    );

    return res.json({
      access_token: token
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    return res.status(500).json({
      detail: "Login failed"
    });
  }
});

module.exports = router;
