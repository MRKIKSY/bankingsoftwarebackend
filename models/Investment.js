const mongoose = require("mongoose");

const InvestmentSchema = new mongoose.Schema({
  user: { type: String, required: true },

  amount: { type: Number, required: true },
  days: { type: Number, required: true },
  percent: { type: Number, required: true },

  expected_return: { type: Number, required: true },

  status: {
    type: String,
    enum: ["pending", "approved", "completed"],
    default: "approved" // IMPORTANT: auto-approved after payment
  },

  paid_at: { type: Date, required: true },
  maturity_date: { type: Date, required: true },

  moved_to_balance: { type: Boolean, default: false },
     matured_processed: {
    type: Boolean,
    default: false
  },

  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Investment", InvestmentSchema);
