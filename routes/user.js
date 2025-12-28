const express = require("express");
const Transaction = require("../models/Transaction");
const Investment = require("../models/Investment");
const { auth } = require("../middleware/auth");

const router = express.Router();

/* ================= USER INFO ================= */
router.get("/me", auth, (req, res) => {
  res.json({
    username: req.user.username,
    email: req.user.email,
    is_admin: req.user.is_admin
  });
});

/* ================= BALANCE ================= */
router.get("/balance", auth, async (req, res) => {
  try {
    const txs = await Transaction.find({
      user_id: req.user.username,
      status: "completed"
    });

    const credits = txs
      .filter(t => t.type === "credit")
      .reduce((a, b) => a + b.amount, 0);

    const debits = txs
      .filter(t => t.type === "debit")
      .reduce((a, b) => a + b.amount, 0);

    /* 🔒 LOCKED = ACTIVE INVESTMENTS */
    const investments = await Investment.find({
      user: req.user.username,
      moved_to_balance: false,
      status: { $ne: "completed" }
    });

    const locked = investments.reduce(
      (s, i) => s + i.amount,
      0
    );

    const available = Math.max(credits - debits, 0);

    res.json({
      balance: available,
      locked_balance: locked,
      total_credits: credits,
      total_debits: debits
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load balance" });
  }
});

/* ================= TRANSACTIONS ================= */
router.get("/transactions", auth, async (req, res) => {
  try {
    const txs = await Transaction.find({
      user_id: req.user.username
    }).sort({ created_at: -1 });

    res.json(txs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load transactions" });
  }
});

/* ================= WITHDRAW REQUEST ================= */
router.post("/withdraw", auth, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid withdrawal amount" });
    }

    // Get completed transactions
    const txs = await Transaction.find({
      user_id: req.user.username,
      status: "completed"
    });

    const credits = txs
      .filter(t => t.type === "credit")
      .reduce((a, b) => a + b.amount, 0);

    const debits = txs
      .filter(t => t.type === "debit")
      .reduce((a, b) => a + b.amount, 0);

    const availableBalance = credits - debits;

    if (amount > availableBalance) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Create pending withdrawal
    await Transaction.create({
      user_id: req.user.username,
      type: "debit",
      amount,
      status: "pending",
      description: "Withdrawal request"
    });

    res.json({
      detail: "Withdrawal request submitted successfully"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Withdrawal failed" });
  }
});


module.exports = router;
