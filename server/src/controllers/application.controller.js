const Application = require("../models/Application");
const Job = require("../models/Job");
const User = require("../models/User");
const createError = require("../utils/createError");
const { getEligibility } = require("./po.controller");

const applyJob = async (req, res, next) => {
  if (req.role !== "student") return next(createError(403, "Only students can apply for jobs!"));
  if (req.subscription !== "business") return next(createError(403, "Application is exclusive to Business Tier students!"));

  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    const existingApp = await Application.findOne({ jobId: req.body.jobId, studentId: req.userId });
    if (existingApp) return next(createError(400, "You have already applied for this job!"));

    const job = await Job.findById(req.body.jobId);
    if (!job) return next(createError(404, "Job not found!"));

    // Check if job is active
    if (job.status !== "active") {
      return next(createError(403, "This job is not currently accepting applications."));
    }

    // On-Campus Restrictions
    if (job.isOnCampus) {
      // 1. Basic University Match Check
      if (job.exclusivePO) {
        const po = await User.findById(job.exclusivePO);
        if (po && po.university?.toLowerCase() !== user.university?.toLowerCase()) {
          return next(createError(403, "This job is exclusive to another university!"));
        }
      }

      // 2. Centralized Eligibility Engine (Hierarchy Enforcement)
      const eligibility = await getEligibility(user, job);
      if (!eligibility.isEligible) {
        return next(createError(403, eligibility.message));
      }
    }

    const newApplication = new Application({
      ...req.body,
      studentId: req.userId,
      hrId: job.hrId,
    });

    const savedApplication = await newApplication.save();
    res.status(201).json(savedApplication);
  } catch (err) {
    next(err);
  }
};

const getJobApplicants = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job) return next(createError(404, "Job not found!"));
    if (job.hrId.toString() !== req.userId && !req.isAdmin) return next(createError(403, "Access denied!"));

    const { minCgpa, skill, minAts } = req.query;

    let query = { jobId: req.params.jobId };

    if (minCgpa) {
      query.submittedCgpa = { $gte: parseFloat(minCgpa) };
    }

    if (skill) {
      query.submittedSkills = { $regex: skill, $options: "i" };
    }

    if (minAts) {
      query.atsScore = { $gte: parseInt(minAts) };
    }

    const applicants = await Application.find(query)
      .populate("studentId", "username img university resumeData")
      .sort({ createdAt: -1 });

    res.status(200).json(applicants);
  } catch (err) {
    next(err);
  }
};

const getStudentApplications = async (req, res, next) => {
  try {
    const applications = await Application.find({ studentId: req.userId })
      .populate("jobId", "companyName jobRole")
      .populate("hrId", "username hrVerification.companyName")
      .sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (err) {
    next(err);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return next(createError(404, "Application not found!"));
    
    // Task 4.3: Prevent changing status if already "hired"
    if (application.status === "hired" && req.body.status && req.body.status !== "hired") {
      return next(createError(400, "Once a candidate is marked as 'Hired', their status cannot be changed."));
    }
    
    // Check if HR of the job
    const job = await Job.findById(application.jobId);
    if (job.hrId.toString() !== req.userId && !req.isAdmin) return next(createError(403, "Access denied!"));

    application.status = req.body.status || application.status;
    application.recruitmentDetails = req.body.recruitmentDetails !== undefined ? req.body.recruitmentDetails : application.recruitmentDetails;
    await application.save();

    // If status is "hired" and job is on-campus, update user's highest offer
    if (application.status === "hired" && job.isOnCampus) {
      const student = await User.findById(application.studentId);
      
      // Fallback: parse from text ctc if numeric field is missing
      let offerAmount = job.numericCtc || 0;
      if (offerAmount === 0 && job.ctc) {
        const match = job.ctc.match(/(\d+(\.\d+)?)/);
        if (match) offerAmount = parseFloat(match[1]);
      }
      
      // Update student placement details automatically from job post
      student.currentHighestOnCampusOffer = offerAmount;
      student.onCampusCompany = job.companyName;
      student.onCampusJobRole = job.jobRole;
      student.onCampusOfferType = job.category;
      
      // Ensure student is searchable for HRs after being placed (optional policy)
      // student.isPlacementReady = true; 

      // Auto-apply PO Multiplier Policy if configured
      const po = await User.findById(job.exclusivePO);
      if (po) {
        const CollegeSettings = require("../models/CollegeSettings");
        const settings = await CollegeSettings.findOne({ poId: po._id });
        if (settings?.autoApplyMultiplier) {
          student.governance = {
            ...(student.governance || {}),
            multiplier: settings.globalMultiplierValue
          };
        }
      }
      
      await student.save();
    }

    res.status(200).json(application);
  } catch (err) {
    next(err);
  }
};

const deleteApplication = async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) return next(createError(404, "Application not found!"));

    // Allow student to delete their own application or HR/Admin
    const isOwner = application.studentId.toString() === req.userId;
    const job = await Job.findById(application.jobId);
    const isHr = job.hrId.toString() === req.userId;

    if (!isOwner && !isHr && !req.isAdmin) return next(createError(403, "Access denied!"));

    await Application.findByIdAndDelete(req.params.id);
    res.status(200).send("Application deleted.");
  } catch (err) {
    next(err);
  }
};

const bulkUpdateRecruitmentDetails = async (req, res, next) => {
  try {
    const { jobId, status, recruitmentDetails } = req.body;
    
    if (!jobId || !status || recruitmentDetails === undefined) {
      return next(createError(400, "Missing required fields!"));
    }

    const job = await Job.findById(jobId);
    if (!job) return next(createError(404, "Job not found!"));
    if (job.hrId.toString() !== req.userId && !req.isAdmin) {
      return next(createError(403, "Access denied!"));
    }

    // Only allow common messages for these statuses
    const allowedStatuses = ["shortlisted", "interview", "hired"];
    if (!allowedStatuses.includes(status)) {
      return next(createError(400, "Bulk updates are only allowed for Shortlisted, Interview, or Hired candidates."));
    }

    const result = await Application.updateMany(
      { jobId, status },
      { $set: { recruitmentDetails } }
    );

    // If status is "hired" and job is on-campus, update all those students
    if (status === "hired" && job.isOnCampus) {
      const applications = await Application.find({ jobId, status: "hired" });
      const studentIds = applications.map(app => app.studentId);
      
      let offerAmount = job.numericCtc || 0;
      if (offerAmount === 0 && job.ctc) {
        const match = job.ctc.match(/(\d+(\.\d+)?)/);
        if (match) offerAmount = parseFloat(match[1]);
      }

      // Prepare the update object
      const updateData = { 
        currentHighestOnCampusOffer: offerAmount,
        onCampusCompany: job.companyName,
        onCampusJobRole: job.jobRole,
        onCampusOfferType: job.category
      };

      // Auto-apply PO Multiplier Policy if configured
      const po = await User.findById(job.exclusivePO);
      if (po) {
        const CollegeSettings = require("../models/CollegeSettings");
        const settings = await CollegeSettings.findOne({ poId: po._id });
        if (settings?.autoApplyMultiplier) {
          // We use $set to preserve other governance fields while updating multiplier
          // Note: updateMany with $set: { "governance.multiplier": ... } works well
          updateData["governance.multiplier"] = settings.globalMultiplierValue;
        }
      }

      await User.updateMany(
        { _id: { $in: studentIds } },
        { $set: updateData }
      );
    }

    res.status(200).json({ 
      message: `Updated ${result.modifiedCount} applications.`,
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    next(err);
  }
};

const getMyOffers = async (req, res, next) => {
  try {
    const offers = await Application.find({ 
      studentId: req.userId, 
      status: "hired" 
    })
    .populate("jobId", "companyName jobRole ctc category isOnCampus createdAt")
    .sort({ updatedAt: -1 });

    res.status(200).json(offers);
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  applyJob, 
  getJobApplicants, 
  getStudentApplications, 
  getMyOffers,
  updateApplicationStatus, 
  deleteApplication,
  bulkUpdateRecruitmentDetails 
};
