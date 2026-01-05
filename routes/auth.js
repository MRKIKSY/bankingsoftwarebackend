const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();



router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ detail: "If email exists, reset link sent" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  user.reset_token = token;
  user.reset_token_expiry = Date.now() + 1000 * 60 * 30; // 30 mins
  await user.save();

  const resetLink = `https://localnairainvest.com/reset-password/${token}`;

  await transporter.sendMail({
    to: user.email,
    subject: "Reset Your Password",
    html: `
      <p>You requested a password reset</p>
      <p>
        <a href="${resetLink}">
          Click here to reset your password
        </a>
      </p>
      <p>This link expires in 30 minutes.</p>
    `,
  });

  res.json({ detail: "Reset link sent" });
});
router.post("/reset-password/:token", async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  const user = await User.findOne({
    reset_token: token,
    reset_token_expiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      detail: "Invalid or expired token",
    });
  }

  user.password = await bcrypt.hash(password, 10);
  user.reset_token = undefined;
  user.reset_token_expiry = undefined;
  await user.save();

  res.json({ detail: "Password reset successful" });
});


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
