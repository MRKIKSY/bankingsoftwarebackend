const express = require("express");
const axios = require("axios");

const Transaction = require("../models/Transaction");
const Investment = require("../models/Investment");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

/* =====================================================
   INIT PAYSTACK PAYMENT (INVESTMENT FUNDING)
===================================================== */
router.post("/init", auth, async (req, res) => {
  try {
    const { amount, days, percent } = req.body;

    if (!amount || Number(amount) <= 0 || !days || !percent) {
      return res.status(400).json({ error: "Invalid investment data" });
    }

    const user = await User.findOne({ username: req.user.username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email: user.email || `${user.username}@localinvest.ng`,
        amount: Number(amount) * 100,
        callback_url: "https://www.localnairainvest.com/paystack-success",
        metadata: {
          username: user.username,
          amount: Number(amount),
          days: Number(days),
          percent: Number(percent)
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json(paystackRes.data.data);
  } catch (err) {
    console.error("PAYSTACK INIT ERROR:", err.response?.data || err);
    res.status(500).json({ error: "Paystack initialization failed" });
  }
});

/* =====================================================
   VERIFY PAYSTACK PAYMENT
===================================================== */
router.get("/verify/:reference", async (req, res) => {

  try {
    const reference = req.params.reference;

    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET}`
        }
      }
    );

    const data = verifyRes.data.data;

    if (data.status !== "success") {
      return res.status(400).json({ error: "Payment not successful" });
    }

    /* ========== PREVENT DOUBLE PROCESSING ========== */
    const exists = await Transaction.findOne({ reference });
    if (exists) {
      return res.json({ detail: "Payment already processed" });
    }

    const { username, amount, days, percent } = data.metadata;

    if (!username || !amount || !days || !percent) {
      return res.status(400).json({ error: "Invalid payment metadata" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    /* =====================================================
       STEP 1: CREDIT USER (FUNDING COMES FROM PAYSTACK)
    ===================================================== */
    await Transaction.create({
      user_id: user.username,
      type: "credit",
      amount: Number(amount),
      status: "completed",
      reference,
      description: "Paystack funding for investment"
    });

    /* =====================================================
       STEP 2: DEBIT SAME AMOUNT (LOCK FUNDS FOR INVESTMENT)
       This ensures AVAILABLE BALANCE DOES NOT INCREASE
    ===================================================== */
    await Transaction.create({
      user_id: user.username,
      type: "debit",
      amount: Number(amount),
      status: "completed",
      description: "Investment lock"
    });

    /* =====================================================
       STEP 3: CALCULATE INVESTMENT DATA
    ===================================================== */
    const paidAt = new Date();

    const maturityDate = new Date(
      paidAt.getTime() + Number(days) * 24 * 60 * 60 * 1000
    );

    const expectedReturn =
      Number(amount) + (Number(amount) * Number(percent)) / 100;

    /* =====================================================
       STEP 4: CREATE INVESTMENT
    ===================================================== */
    await Investment.create({
      user: user.username,
      amount: Number(amount),
      days: Number(days),
      percent: Number(percent),
      expected_return: expectedReturn,
      status: "approved",
      paid_at: paidAt,
      maturity_date: maturityDate,
      moved_to_balance: false
    });

    res.json({
      detail: "Investment funded and locked successfully"
    });
  } catch (err) {
    console.error("PAYSTACK VERIFY ERROR:", err.response?.data || err);
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;
