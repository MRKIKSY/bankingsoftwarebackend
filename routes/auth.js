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
    let { email } = req.body;

    if (!email) {
      return res.status(400).json({ detail: "Email required" });
    }

    email = email.toLowerCase().trim();
    const user = await User.findOne({ email });

    // Always respond the same for security
    if (!user) {
      return res.json({ detail: "If email exists, instructions sent" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.reset_otp = otp;
    user.reset_otp_expiry = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // Link to the frontend reset page
    const resetLink = `https://www.localnairainvest.com/reset-password-otp?email=${encodeURIComponent(user.email)}`;

    await transporter.sendMail({
      from: `"Local Naira Invest" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reset Your Local Naira Invest Password",
      html: `
        <p>You requested a password reset.</p>

        <p>
          <b>Your One-Time Password (OTP):</b>
          <h2>${otp}</h2>
          <small>Expires in 15 minutes</small>
        </p>

        <p>
          Click the link below to open the reset password page:
        </p>

        <p>
          <a href="${resetLink}" target="_blank">Reset Password</a>
        </p>

        <p>If you did not request this, ignore this email.</p>
      `,
    });

    res.json({ detail: "If email exists, instructions sent" });

  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);
    res.status(500).json({ detail: "Server error" });
  }
});

router.post("/reset-password-otp", async (req, res) => {
  try {
    let { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ detail: "All fields are required" });
    }

    email = email.toLowerCase().trim();
    otp = otp.trim();

    const user = await User.findOne({
      email,
      reset_otp: otp,
      reset_otp_expiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ detail: "Invalid OTP or expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.reset_otp = undefined;
    user.reset_otp_expiry = undefined;

    await user.save();

    res.json({ detail: "Password reset successful" });

  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);
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
