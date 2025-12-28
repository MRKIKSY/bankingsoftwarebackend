const express = require("express");
const crypto = require("crypto");

const Transaction = require("../models/Transaction");
const Investment = require("../models/Investment");

const router = express.Router();

/*
 ⚠️ IMPORTANT
 Paystack requires RAW body, not JSON-parsed body
*/
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET)
        .update(req.body)
        .digest("hex");

      if (hash !== req.headers["x-paystack-signature"]) {
        return res.sendStatus(400);
      }

      const event = JSON.parse(req.body.toString());

      if (event.event === "charge.success") {
        const data = event.data;
        const { username, amount, days, percent } = data.metadata;
        const reference = data.reference;

        // Prevent double processing
        const exists = await Transaction.findOne({ reference });
        if (exists) return res.sendStatus(200);

        const nairaAmount = amount / 100;

        // CREDIT
        await Transaction.create({
          user_id: username,
          type: "credit",
          amount: nairaAmount,
          status: "completed",
          reference,
          description: "Paystack funding"
        });

        // DEBIT (LOCK)
        await Transaction.create({
          user_id: username,
          type: "debit",
          amount: nairaAmount,
          status: "completed",
          description: "Investment lock"
        });

        const paidAt = new Date();
        const maturityDate = new Date(
          paidAt.getTime() + Number(days) * 24 * 60 * 60 * 1000
        );

        const expectedReturn =
          nairaAmount + (nairaAmount * Number(percent)) / 100;

        await Investment.create({
          user: username,
          amount: nairaAmount,
          days,
          percent,
          expected_return: expectedReturn,
          status: "approved",
          paid_at: paidAt,
          maturity_date: maturityDate,
          moved_to_balance: false
        });
      }

      res.sendStatus(200);
    } catch (err) {
      console.error("PAYSTACK WEBHOOK ERROR:", err);
      res.sendStatus(500);
    }
  }
);

module.exports = router;
