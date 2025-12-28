const express = require("express");
const crypto = require("crypto");

const Transaction = require("../models/Transaction");
const Investment = require("../models/Investment");

const router = express.Router();

/*
 Paystack requires RAW body
*/
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET)
        .update(req.body)
        .digest("hex");

      if (signature !== req.headers["x-paystack-signature"]) {
        return res.sendStatus(400);
      }

      const event = JSON.parse(req.body.toString());

      if (event.event !== "charge.success") {
        return res.sendStatus(200);
      }

      const data = event.data;

      const reference = data.reference;
      const username = data.metadata?.username;
      const days = Number(data.metadata?.days);
      const percent = Number(data.metadata?.percent);

      if (!username || !days || !percent) {
        return res.sendStatus(200);
      }

      // 🔐 PREVENT DOUBLE CREDIT
      const exists = await Transaction.findOne({ reference });
      if (exists) return res.sendStatus(200);

      // ✅ PAYSTACK AMOUNT IS IN KOBO
      const nairaAmount = data.amount / 100;

      /* CREDIT */
      await Transaction.create({
        user_id: username,
        type: "credit",
        amount: nairaAmount,
        status: "completed",
        reference,
        description: "Paystack funding"
      });

      /* LOCK */
      await Transaction.create({
        user_id: username,
        type: "debit",
        amount: nairaAmount,
        status: "completed",
        description: "Investment lock"
      });

      const paidAt = new Date();
      const maturityDate = new Date(
        paidAt.getTime() + days * 24 * 60 * 60 * 1000
      );

      const expectedReturn =
        nairaAmount + (nairaAmount * percent) / 100;

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

      return res.sendStatus(200);
    } catch (err) {
      console.error("PAYSTACK WEBHOOK ERROR:", err);
      return res.sendStatus(500);
    }
  }
);

module.exports = router;
