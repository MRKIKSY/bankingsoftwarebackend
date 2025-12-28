const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const { auth, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.post("/credit", auth, adminOnly, async (req, res) => {
  try {
    const { username, amount, description } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    await Transaction.create({
      user_id: username,
      type: "credit",
      amount,
      description,
      status: "completed"
    });

    res.json({ detail: "Credit added" });
  } catch (err) {
    res.status(500).json({ error: "Failed to add credit" });
  }
});

router.get("/pending", auth, adminOnly, async (req, res) => {
  try {
    const txs = await Transaction.find({ status: "pending" });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch pending transactions" });
  }
});

router.post("/approve/:id", auth, adminOnly, async (req, res) => {
  try {
    await Transaction.findByIdAndUpdate(req.params.id, {
      status: "completed"
    });
    res.json({ detail: "Transaction approved" });
  } catch (err) {
    res.status(500).json({ error: "Approval failed" });
  }
});



router.get("/users", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, "-hashed_password");

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
          address: user.address,
          is_admin: user.is_admin,
          balance: credits - debits,
          total_credits: credits,
          total_debits: debits,
          transactions_count: txs.length
        };
      })
    );

    res.json(usersWithStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.get("/user/:username", auth, async (req, res) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: "Access denied" });
  }

  const { username } = req.params;

  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  const transactions = await Transaction.find({ user_id: username })
    .sort({ created_at: -1 });

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
    transactions
  });
});

router.get("/user/:username/full", auth, async (req, res) => {
  if (!req.user.is_admin) return res.status(403).json({ error: "Access denied" });

  const { username } = req.params;
  const user = await User.findOne({ username });
  if (!user) return res.status(404).json({ error: "User not found" });

  // Transactions
  const transactions = await Transaction.find({ user_id: username })
    .sort({ created_at: -1 });

  // Pending investments
  const pendingInvestments = await Investment.find({ user: username, status: "pending" })
    .sort({ created_at: -1 });

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
    pendingInvestments
  });
});

router.post("/admin/approve/:id", auth, adminOnly, async (req, res) => {
  try {
    const inv = await Investment.findById(req.params.id);
    if (!inv) return res.status(404).json({ detail: "Investment not found" });

    if (inv.status === "approved") {
      return res.status(400).json({ detail: "Already approved" });
    }

    const start = new Date();
    const maturity = new Date();
    maturity.setDate(maturity.getDate() + inv.days);

    inv.status = "approved";
    inv.start_date = start;
    inv.maturity_date = maturity;
    await inv.save();

    // 🔓 UNLOCK SIGNUP BONUS
    const user = await User.findOne({ username: inv.user });
    if (user && !user.bonus_unlocked) {
      user.bonus_unlocked = true;
      await user.save();
    }

    res.json({ detail: "Investment approved & signup bonus unlocked" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Approval failed" });
  }
});

router.get("/investments", auth, adminOnly, async (req, res) => {
  try {
    const investments = await Investment.find()
      .sort({ maturity_date: 1 });

    res.json(investments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch investments" });
  }
});

module.exports = router;
