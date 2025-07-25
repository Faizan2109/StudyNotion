const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

// Schema definition
const OTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now, // ✅ use reference, not function call
      expires: 5 * 60,    // ✅ 5 minutes TTL
    },
  }
);

// Send verification email before saving
OTPSchema.pre("save", async function (next) {
  try {
    await mailSender(this.email, "Verification Email from StudyNotion", this.otp);
    console.log("✅ Email sent successfully");
    next();
  } catch (error) {
    console.log("❌ Error occurred while sending email:", error);
    next(error);
  }
});

module.exports = mongoose.model("OTP", OTPSchema);
