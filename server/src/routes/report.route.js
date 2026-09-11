const express = require("express");
const { 
  createReport, 
  getReportsForAdmin, 
  submitCounterResponse, 
  resolveReport,
  getMyReports,
  deleteReport
} = require("../controllers/report.controller");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

router.post("/", verifyToken, createReport);
router.get("/admin", verifyToken, getReportsForAdmin);
router.get("/my-reports", verifyToken, getMyReports);
router.put("/respond/:id", verifyToken, submitCounterResponse);
router.put("/resolve/:id", verifyToken, resolveReport);
router.delete("/:id", verifyToken, deleteReport);

module.exports = router;
