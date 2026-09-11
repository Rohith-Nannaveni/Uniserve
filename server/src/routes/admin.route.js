const express = require("express");
const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");
const { getPendingVerifications, resolveVerification, getPendingAppeals, resolveAppeal } = require("../controllers/admin.controller");

const router = express.Router();

router.get("/pending-verifications", verifyAdmin, getPendingVerifications);
router.patch("/resolve-verification", verifyAdmin, resolveVerification);
router.get("/pending-appeals", verifyAdmin, getPendingAppeals);
router.post("/resolve-appeal", verifyAdmin, resolveAppeal);

module.exports = router;
