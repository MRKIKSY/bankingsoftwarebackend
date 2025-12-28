const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
// require("./cron/investmentCron");

// Routes
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
const cronRoutes = require("./routes/cron");



// Middleware
const { auth } = require("./middleware/auth");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", authRoutes);
app.use("/", userRoutes);
app.use("/admin", adminRoutes);
app.use("/invest", investRoutes);
app.use("/cron", cronRoutes);

// Routes requiring authentication
app.use("/remind", auth, remindRoute);

// Other routes
app.use("/notify-admin", notifyAdminRoute);
app.use("/invest", investCancelRoute); // cancels investment
app.use("/invest/admin", adminApproveInvestment); // approve investments
app.use("/admin", adminApproveWithdrawal); // approve withdrawals
app.use("/pay", payRoutes);


// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
