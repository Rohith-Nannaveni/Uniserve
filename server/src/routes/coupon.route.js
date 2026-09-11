const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const {
  createCoupon,
  validateCoupon,
  getCoupons,
  getPendingCoupons,
  approveCoupon,
  getVendorCoupons,
  getUserCoupons,
  deleteCoupon,
} = require("../controllers/coupon.controller");

const router = express.Router();

router.post("/", verifyToken, createCoupon);
router.get("/my", verifyToken, getVendorCoupons);
router.get("/user", verifyToken, getUserCoupons);
router.delete("/:id", verifyToken, deleteCoupon);
router.get("/validate/:code", verifyToken, validateCoupon); 
router.get("/", verifyToken, getCoupons);
router.get("/pending", verifyToken, getPendingCoupons);
router.patch("/approve/:id", verifyToken, approveCoupon);

module.exports = router;
