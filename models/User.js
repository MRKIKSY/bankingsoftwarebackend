const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  is_admin: {
    type: Boolean,
    default: false,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },

  // 🔐 PASSWORD RESET FIELDS
  reset_token: {
    type: String,
  },

  reset_token_expiry: {
    type: Date,
  },
});

module.exports = mongoose.model("User", UserSchema);


