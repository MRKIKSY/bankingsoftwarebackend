const express = require("express");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const Investment = require("../models/Investment");
const sendReminder = require("../routes/remind");

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
    const users = await User.find()
      .select("username email phone is_admin")
      .lean();

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
          phone: user.phone,        // ✅ NOW WILL SHOW
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

  const user = await User.findOne({ username }).select("-password");
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

/* ================= WITHDRAWALS (ADMIN) ================= */
router.get("/withdrawals", auth, adminOnly, async (req, res) => {
  try {
    const withdrawals = await Transaction.find({
      type: "debit"
    }).sort({ created_at: -1 });

    res.json(withdrawals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

/* ================= USER WALLETS (ADMIN) ================= */
router.get("/wallets", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find(
      {},
      "username email bank_name account_number account_name"
    );

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch wallets" });
  }
});

router.post("/withdraw/approve/:id", auth, adminOnly, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: "Withdrawal not found" });

    if (tx.status !== "pending") {
      return res.status(400).json({ error: "Already processed" });
    }

    tx.status = "completed";
    await tx.save();

    res.json({ detail: "Withdrawal approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Approval failed" });
  }
});

router.post("/withdraw/reject/:id", auth, adminOnly, async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ error: "Withdrawal not found" });

    if (tx.status !== "pending") {
      return res.status(400).json({ error: "Already processed" });
    }

    tx.status = "rejected";
    await tx.save();

    res.json({ detail: "Withdrawal rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Rejection failed" });
  }
});

/* ================= SEND USER REMINDER ================= */
router.post("/remind/:username", auth, adminOnly, async (req, res) => {
  try {
    let { username } = req.params;

    username = username.trim();

    console.log("REMIND PARAM:", username);

    const user = await User.findOne({
      $expr: {
        $eq: [{ $trim: { input: "$username" } }, username]
      }
    });

    console.log("FOUND USER:", user?.username);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await sendReminder(user);

    res.json({ detail: `Reminder sent to ${user.username}` });
  } catch (err) {
    console.error("REMIND ERROR:", err);
    res.status(500).json({ error: "Failed to send reminder" });
  }
});


/* ================= USERS CONTACT INFO ================= */
router.get("/users/contact", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, "username email phone");
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users' contact info" });
  }
});

module.exports = router;
