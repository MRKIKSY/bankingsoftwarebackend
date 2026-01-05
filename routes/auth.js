const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

const router = express.Router();

// ======================
// EMAIL TRANSPORTER
// ======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================
// REQUEST OTP
// ======================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ detail: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.json({ detail: "If email exists, OTP sent" }); // never reveal existence

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.reset_otp = otp;
    user.reset_otp_expiry = Date.now() + 15 * 60 * 1000; // 15 min expiry
    await user.save();

    // Send OTP via email
    await transporter.sendMail({
      from: `"Local Naira Invest" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your Password Reset OTP",
      html: `<p>Your password reset OTP is <b>${otp}</b>. It expires in 15 minutes.</p>`,
    });

    res.json({ detail: "OTP sent if email exists" });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ detail: "Server error" });
  }
});

// ======================
// RESET PASSWORD USING OTP
// ======================
router.post("/reset-password-otp", async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ detail: "All fields are required" });
    }

    const user = await User.findOne({
      email,
      reset_otp: otp,
      reset_otp_expiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ detail: "Invalid OTP or expired" });
    }

    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.reset_otp = undefined;
    user.reset_otp_expiry = undefined;
    await user.save();

    res.json({ detail: "Password reset successful" });
  } catch (err) {
    console.error("RESET PASSWORD OTP ERROR:", err);
    res.status(500).json({ detail: "Server error" });
  }
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
