const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { adminOnly } = require("../middleware/auth");

router.post("/", adminOnly, async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.email) {
      return res.status(400).json({ message: "User email missing" });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("EMAIL ENV MISSING");
      return res.status(500).json({ message: "Email configuration missing" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Local Invest NG" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Reminder: Pending Investment Payment",
      html: `<p>Hello ${user.username}, this is a reminder.</p>`
    });

    res.json({ message: `Reminder sent to ${user.email}` });

  } catch (err) {
    console.error("REMINDER ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
