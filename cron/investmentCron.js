// const cron = require("node-cron");
// const Investment = require("../models/Investment");

// cron.schedule("* * * * *", async () => {
//   try {
//     const now = new Date();

//     const matured = await Investment.updateMany(
//       {
//         status: "approved",
//         maturity_date: { $lte: now }
//       },
//       {
//         $set: { status: "completed" }
//       }
//     );

//     if (matured.modifiedCount > 0) {
//       console.log(`✅ ${matured.modifiedCount} investments matured`);
//     }
//   } catch (err) {
//     console.error("❌ Cron error:", err);
//   }
// });
