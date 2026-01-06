// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const path = require("path");
// require("dotenv").config();

// const app = express(); // MUST BE FIRST

// // ================= CRON =================
// require("./cron/investmentCron");

// // ================= ROUTES =================
// const authRoutes = require("./routes/auth");
// const userRoutes = require("./routes/user");
// const adminRoutes = require("./routes/admin");
// const investRoutes = require("./routes/invest");
// const remindRoute = require("./routes/remind");
// const notifyAdminRoute = require("./routes/notifyAdmin");
// const investCancelRoute = require("./routes/investCancel");
// const adminApproveInvestment = require("./routes/adminApproveInvestment");
// const adminApproveWithdrawal = require("./routes/adminApproveWithdrawal");
// const payRoutes = require("./routes/pay");
// const paystackWebhook = require("./routes/paystackWebhook");

// // ================= MIDDLEWARE =================
// const { auth } = require("./middleware/auth");

// /* ======================================================
//    PAYSTACK WEBHOOK (MUST COME BEFORE JSON)
// ====================================================== */
// app.use("/paystack", paystackWebhook);

// /* ======================================================
//    CORS
// ====================================================== */
// const allowedOrigins = [
//   "https://www.localnairainvest.com",
//   "https://api.localnairainvest.com",
// ];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.includes(origin)) return callback(null, true);
//       callback(new Error("CORS not allowed"));
//     },
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// /* ======================================================
//    BODY PARSERS
// ====================================================== */
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* ======================================================
//    DATABASE
// ====================================================== */
// mongoose
//   .connect(process.env.MONGO_URL)
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => console.error("❌ MongoDB error:", err));

// /* ======================================================
//    API ROUTES
// ====================================================== */
// app.use("/auth", authRoutes);
// app.use("/", userRoutes);
// app.use("/admin", adminRoutes);
// app.use("/invest", investRoutes);

// // Auth protected
// app.use("/remind", auth, remindRoute);

// // Other routes
// app.use("/notify-admin", notifyAdminRoute);
// app.use("/invest", investCancelRoute);
// app.use("/invest/admin", adminApproveInvestment);
// app.use("/admin", adminApproveWithdrawal);
// app.use("/pay", payRoutes);

// /* ======================================================
//    HEALTH CHECK
// ====================================================== */
// app.get("/health", (req, res) => {
//   res.json({ status: "Backend running 🚀" });
// });

// /* ======================================================
//    SERVE REACT FRONTEND
// ====================================================== */
// const buildPath = path.join(__dirname, "build"); // <-- React build is here
// app.use(express.static(buildPath));

// // Catch-all for React Router (ignore API routes)
// app.get(
//   /^\/(?!auth|invest|admin|pay|remind|notify-admin).*/,
//   (req, res) => {
//     res.sendFile(path.join(buildPath, "index.html"));
//   }
// );

// /* ======================================================
//    SERVER
// ====================================================== */
// const PORT = process.env.PORT || 8000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express(); // MUST be first

// ================= CRON =================
require("./cron/investmentCron");

// ================= ROUTES =================
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const investRoutes = require("./routes/invest");
const remindRoute = require("./routes/remind");
const notifyAdminRoute = require("./routes/notifyAdmin");
const investCancelRoute = require("./routes/investCancel");
const adminApproveInvestment = require("./routes/adminApproveInvestment");
const adminApproveWithdrawal = require("./routes/adminApproveWithdrawal");
const payRoutes = require("./routes/pay");
const paystackWebhook = require("./routes/paystackWebhook");

// ================= MIDDLEWARE =================
const { auth } = require("./middleware/auth");

// ================= PAYSTACK WEBHOOK (must come before JSON parsers) =================
app.use("/paystack", paystackWebhook);

// ================= CORS =================
const allowedOrigins = [
  "https://www.localnairainvest.com",
  "https://api.localnairainvest.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("CORS not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ================= BODY PARSERS =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= DATABASE =================
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ================= API ROUTES =================
app.use("/auth", authRoutes);
app.use("/", userRoutes);
app.use("/admin", adminRoutes);
app.use("/invest", investRoutes);

// Protected routes
app.use("/remind", auth, remindRoute);

// Other routes
app.use("/notify-admin", notifyAdminRoute);
app.use("/invest", investCancelRoute);
app.use("/invest/admin", adminApproveInvestment);
app.use("/admin", adminApproveWithdrawal);
app.use("/pay", payRoutes);

// ================= HEALTH CHECK =================
app.get("/health", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

// ================= SERVE REACT FRONTEND =================
const buildPath = path.join(__dirname, "build");
app.use(express.static(buildPath));

// Catch-all for React routes (ignores API routes)
app.get(
  /^\/(?!auth|invest|admin|pay|remind|notify-admin|paystack).*$/,
  (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  }
);

// ================= START SERVER =================
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
