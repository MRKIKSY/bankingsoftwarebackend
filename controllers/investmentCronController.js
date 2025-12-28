const Investment = require("../models/Investment");
const Transaction = require("../models/Transaction");

exports.processMaturedInvestments = async (req, res) => {
  try {
    // 🔐 Secure endpoint
    if (req.headers["x-cron-secret"] !== process.env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const now = new Date();

    const investments = await Investment.find({
      status: "approved",
      maturity_date: { $lte: now },
      matured_processed: false
    });

    let processed = 0;

    for (const inv of investments) {
      // Credit principal
      await Transaction.create({
        user_id: inv.user,
        type: "credit",
        amount: inv.amount,
        status: "completed",
        description: "Investment principal matured"
      });

      // Credit profit
      const profit = inv.expected_return - inv.amount;
      if (profit > 0) {
        await Transaction.create({
          user_id: inv.user,
          type: "credit",
          amount: profit,
          status: "completed",
          description: "Investment profit matured"
        });
      }

      inv.status = "completed";
      inv.matured_processed = true;
      await inv.save();

      processed++;
    }

    res.json({ processed });
  } catch (err) {
    console.error("CRON ERROR:", err);
    res.status(500).json({ error: "Cron failed" });
  }
};
