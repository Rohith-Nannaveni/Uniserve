const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const { analyzeResume, getResumeData, togglePlacementReady, submitVerification, respondToPoRemoval } = require("../controllers/career.controller");

const router = express.Router();

router.post("/analyze", verifyToken, analyzeResume);
router.get("/resume", verifyToken, getResumeData);
router.patch("/placement-ready", verifyToken, togglePlacementReady);
router.post("/verify", verifyToken, submitVerification);
router.post("/po-removal-response", verifyToken, respondToPoRemoval);

module.exports = router;
