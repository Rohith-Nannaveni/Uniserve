const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const {
  applyJob,
  getJobApplicants,
  getStudentApplications,
  getMyOffers,
  updateApplicationStatus,
  deleteApplication,
  bulkUpdateRecruitmentDetails
} = require("../controllers/application.controller");

const router = express.Router();

router.post("/", verifyToken, applyJob);
router.post("/bulk-update-details", verifyToken, bulkUpdateRecruitmentDetails);
router.get("/student", verifyToken, getStudentApplications);
router.get("/my-offers", verifyToken, getMyOffers);
router.get("/applicants/:jobId", verifyToken, getJobApplicants);
router.put("/:id/status", verifyToken, updateApplicationStatus);
router.delete("/:id", verifyToken, deleteApplication);

module.exports = router;
