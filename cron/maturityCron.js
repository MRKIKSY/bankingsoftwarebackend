// const Investment = require("../models/Investment");

// async function matureInvestments() {
//   const now = new Date();

//   const matured = await Investment.updateMany(
//     {
//       status: "approved",
//       maturity_date: { $lte: now }
//     },
//     {
//       $set: { status: "completed" }
//     }
//   );

//   if (matured.modifiedCount > 0) {
//     console.log(`✅ ${matured.modifiedCount} investments matured`);
//   }
// }

// module.exports = matureInvestments;
