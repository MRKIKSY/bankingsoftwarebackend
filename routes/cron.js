const express = require("express");
const router = express.Router();
const {
  processMaturedInvestments
} = require("../controllers/investmentCronController");

router.post("/investments", processMaturedInvestments);

module.exports = router;
