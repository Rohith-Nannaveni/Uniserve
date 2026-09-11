const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const {
  createJob,
  getJobs,
  getHRJobs,
  getJob,
  updateJob,
  deleteJob
} = require("../controllers/job.controller");

const router = express.Router();

router.post("/", verifyToken, createJob);
router.get("/", verifyToken, getJobs);
router.get("/hr", verifyToken, getHRJobs);
router.get("/:id", verifyToken, getJob);
router.put("/:id", verifyToken, updateJob);
router.delete("/:id", verifyToken, deleteJob);

module.exports = router;
