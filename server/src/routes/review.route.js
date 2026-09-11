const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const {
  createReview,
  getReviews,
  deleteReview,
  updateReview,
} = require("../controllers/review.controller");

const router = express.Router();

router.post("/", verifyToken, createReview);
router.get("/:serviceId", getReviews);
router.delete("/:id", verifyToken, deleteReview);
router.put("/:id", verifyToken, updateReview);

module.exports = router;
