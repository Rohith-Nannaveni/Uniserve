const express = require("express");
const { 
  shareJobBulk, 
  recommendStudent, 
  getAnalytics, 
  getStudents,
  removeStudent,
  bulkRemoveStudents,
  getReaddRequests,
  readdStudent,
  setStudentGovernance,
  getCollegeSettings,
  updateCollegeSettings,
  getUniversityJobBoard,
  getPOSharingHistory,
  getPendingJobs,
  approveJob,
  revokeDrive,
  dismissJob,
  dismissShare,
  updateStudentPlacementStatus,
  globalCampusReset,
  checkStudentEligibility,
  createDataRequest,
  getRequestedListData,
  getDriveRequestsForPO
} = require("../controllers/po.controller");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

router.get("/university-jobs", verifyToken, getUniversityJobBoard);
router.get("/sharing-history", verifyToken, getPOSharingHistory);
router.get("/pending-jobs", verifyToken, getPendingJobs);
router.patch("/approve-job/:jobId", verifyToken, approveJob);
router.delete("/revoke-drive/:jobId", verifyToken, revokeDrive);
router.patch("/dismiss-job/:jobId", verifyToken, dismissJob);
router.patch("/dismiss-share/:shareId", verifyToken, dismissShare);
router.post("/share-job", verifyToken, shareJobBulk);
router.put("/recommend/:studentId", verifyToken, recommendStudent);
router.get("/analytics", verifyToken, getAnalytics);
router.get("/students", verifyToken, getStudents);
router.delete("/students/bulk", verifyToken, bulkRemoveStudents);
router.delete("/students/:studentId", verifyToken, removeStudent);
router.get("/readd-requests", verifyToken, getReaddRequests);
router.patch("/readd/:studentId", verifyToken, readdStudent);
router.put("/governance/:studentId", verifyToken, setStudentGovernance);
router.patch("/students/:studentId/placement-status", verifyToken, updateStudentPlacementStatus);
router.post("/reset-campus-data", verifyToken, globalCampusReset);
router.get("/check-eligibility/:jobId", verifyToken, checkStudentEligibility);
router.post("/request-list", verifyToken, createDataRequest);
router.get("/requested-list/:requestId", verifyToken, getRequestedListData);
router.get("/drive-requests/:jobId", verifyToken, getDriveRequestsForPO);
router.get("/settings", verifyToken, getCollegeSettings);
router.put("/settings", verifyToken, updateCollegeSettings);

module.exports = router;