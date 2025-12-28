const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Investment = require("../models/Investment");

const { auth, adminOnly } = require("../middleware/auth");

const router = express.Router();

/* ================= MANUAL CREDIT ================= */
router.post("/credit", auth, adminOnly, async (req, res) => {
  try {
    const { username, amount, description } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    await Transaction.create({
      user_id: username,
      type: "credit",
      amount,
      description,
      status: "completed"
    });

    res.json({ detail: "Credit added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add credit" });
  }
});

/* ================= ALL USERS ================= */
router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, "-password");

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const txs = await Transaction.find({
          user_id: user.username,
          status: "completed"
        });

        const credits = txs
          .filter(t => t.type === "credit")
          .reduce((a, b) => a + b.amount, 0);

        const debits = txs
          .filter(t => t.type === "debit")
          .reduce((a, b) => a + b.amount, 0);

        return {
          username: user.username,
          email: user.email,
          is_admin: user.is_admin,
          balance: credits - debits,
          total_credits: credits,
          total_debits: debits
        };
      })
    );

    res.json(usersWithStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

/* ================= SINGLE USER (FULL VIEW) ================= */
router.get("/user/:username", auth, adminOnly, async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const transactions = await Transaction.find({ user_id: username })
      .sort({ created_at: -1 });

    const investments = await Investment.find({
      user: username,
      status: "approved"
    }).sort({ maturity_date: 1 });

    const credits = transactions
      .filter(t => t.type === "credit" && t.status === "completed")
      .reduce((a, b) => a + b.amount, 0);

    const debits = transactions
      .filter(t => t.type === "debit" && t.status === "completed")
      .reduce((a, b) => a + b.amount, 0);

    res.json({
      user,
      balance: credits - debits,
      credits,
      debits,
      transactions,
      investments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load user" });
  }
});

/* ================= ALL INVESTMENTS (ADMIN) ================= */
router.get("/investments", auth, adminOnly, async (req, res) => {
  try {
    const investments = await Investment.find({})
      .sort({ maturity_date: 1 });

    res.json(investments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch investments" });
  }
});

module.exports = router;
