const express = require("express");
const { register, login, logout, googleAuth, completeGoogleAuth, checkUsername, verifyOTP, resendOTP, forgotPassword, resetPassword } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/google", googleAuth);
router.post("/google-complete", completeGoogleAuth);
router.get("/check-username/:username", checkUsername);
router.post("/verify-otp", verifyOTP);
router.post("/resend-otp", resendOTP);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/config/razorpay", (req, res) => res.status(200).send(process.env.RAZORPAY_KEY_ID));

module.exports = router;
