const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const {
  submitBranchRequest,
  getPendingBranchRequests,
  handleBranchRequestDecision
} = require("../controllers/branch.controller");

const router = express.Router();

router.post("/submit", verifyToken, submitBranchRequest);
router.get("/pending", verifyToken, getPendingBranchRequests);
router.patch("/decision/:studentId", verifyToken, handleBranchRequestDecision);

module.exports = router;
