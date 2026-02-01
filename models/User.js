// const mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true,
//   },

//   email: {
//     type: String,
//     required: true,
//     unique: true,
//   },

//   password: {
//     type: String,
//     required: true,
//   },

//   is_admin: {
//     type: Boolean,
//     default: false,
//   },

//   created_at: {
//     type: Date,
//     default: Date.now,
//   },

//   // 🔐 PASSWORD RESET (OTP)
//   reset_otp: {
//     type: String,
//   },

//   reset_otp_expiry: {
//     type: Date,
//   },
// });

// module.exports = mongoose.model("User", UserSchema);


const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  address: {
    type: String,
    required: true,
  },

  signup_code: {
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

  // 🔐 PASSWORD RESET (OTP)
  reset_otp: {
    type: String,
  },

  reset_otp_expiry: {
    type: Date,
  },
});

module.exports = mongoose.model("User", UserSchema);
