const express = require("express");
const router = express.Router();
const { capturePayment, handleStripeSuccess } = require("../controllers/Payments");
const { auth } = require("../middlewares/auth");

router.post("/capture-payment", auth, capturePayment);
router.post("/verify-payment", auth, handleStripeSuccess);



module.exports = router;
