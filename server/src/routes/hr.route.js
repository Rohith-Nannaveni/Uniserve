const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const { 
  searchStudents, 
  getCandidateProfile, 
  getPOByUniversity, 
  getHRDirectory, 
  getPODirectory,
  getDriveRequests,
  fulfillRequest,
  pushDriveDataToPO
} = require("../controllers/hr.controller");

const router = express.Router();

router.get("/search-students", verifyToken, searchStudents);
router.get("/candidate/:id", verifyToken, getCandidateProfile);
router.get("/po-contact", verifyToken, getPOByUniversity);
router.get("/directory", verifyToken, getHRDirectory);
router.get("/po-directory", verifyToken, getPODirectory);
router.get("/drive-requests/:jobId", verifyToken, getDriveRequests);
router.patch("/fulfill-request/:requestId", verifyToken, fulfillRequest);
router.post("/push-data", verifyToken, pushDriveDataToPO);

module.exports = router;
