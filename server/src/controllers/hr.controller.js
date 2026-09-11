const User = require("../models/User");
const CollegeSettings = require("../models/CollegeSettings");
const createError = require("../utils/createError");

const searchStudents = async (req, res, next) => {
  try {
    const { university, skill, minAts } = req.query;
    
    // Base query: Business tier users who opted in for placement support
    let query = { 
      role: "student", 
      subscription: "business", 
      isPlacementReady: true,
      "studentVerification.status": "approved"
    };

    if (university) {
      query.university = { $regex: university, $options: "i" };
    }

    if (skill) {
      query["resumeData.parsedSkills"] = { $regex: skill, $options: "i" };
    }

    if (minAts) {
      query["resumeData.atsScore"] = { $gte: parseInt(minAts) };
    }

    const students = await User.find(query)
      .select("username img university branch specialization trustBadge resumeData subscription isPlacementReady isRecommended")
      .sort({ "resumeData.atsScore": -1 });

    res.status(200).json(students);
  } catch (err) {
    next(err);
  }
};

const getCandidateProfile = async (req, res, next) => {
  try {
    const student = await User.findById(req.params.id)
      .select("username email img country desc phone university branch specialization graduationYear trustBadge resumeData subscription isPlacementReady isRecommended studentVerification.transcripts studentVerification.status studentVerification.collegeId governance currentHighestOnCampusOffer onCampusCompany");

    if (!student) return next(createError(404, "Candidate not found!"));
    
    // Allow viewing if:
    // 1. Profile is searchable (isPlacementReady)
    // 2. Requester is an admin
    // 3. Requester is the profile owner themselves
    const isOwner = req.userId && req.userId === student._id.toString();
    
    if (!student.isPlacementReady && !req.isAdmin && !isOwner) {
      return next(createError(403, "This profile is private."));
    }

    const studentObj = student.toObject();

    // If student is viewing their own profile, also fetch global branch restrictions
    if (isOwner && student.university) {
      const po = await User.findOne({ role: "po", university: student.university, "poVerification.status": "approved" });
      if (po) {
        const settings = await CollegeSettings.findOne({ poId: po._id });
        if (settings) {
          studentObj.globalSettings = {
            autoApplyMultiplier: settings.autoApplyMultiplier,
            globalMultiplierValue: settings.globalMultiplierValue,
            branchRestriction: settings.branchRestrictions?.find(r => r.branch.toLowerCase() === (student.branch || "").toLowerCase())
          };
        }
      }
    }

    res.status(200).json(studentObj);
  } catch (err) {
    next(err);
  }
};

const getPOByUniversity = async (req, res, next) => {
  try {
    const { university } = req.query;
    if (!university) return next(createError(400, "University name is required!"));

    const po = await User.findOne({
      role: "po",
      university: { $regex: new RegExp("^" + university.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") },
      "poVerification.status": "approved"
    }).select("username email university poVerification.department img");

    if (!po) return next(createError(404, "Verified Placement Officer not found for this university."));

    res.status(200).json(po);
  } catch (err) {
    next(err);
  }
};

const getHRDirectory = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = {
      role: "hr",
      "hrVerification.status": "approved",
      "hrVerification.isProfileVisible": true
    };

    if (search) {
      query["hrVerification.companyName"] = { $regex: search, $options: "i" };
    }

    const hrs = await User.find(query).select("username email hrVerification.companyName desc img hrVerification.workEmail reliabilityStatus");

    res.status(200).json(hrs);
  } catch (err) {
    next(err);
  }
};

const getPODirectory = async (req, res, next) => {
  try {
    const { search, department } = req.query;
    let query = {
      role: "po",
      "poVerification.status": "approved",
      "poVerification.isProfileVisible": true
    };

    if (search) {
      query.university = { $regex: search, $options: "i" };
    }

    if (department) {
      query["poVerification.department"] = { $regex: department, $options: "i" };
    }

    const pos = await User.find(query).select("username email university desc img poVerification.department reliabilityStatus");

    res.status(200).json(pos);
  } catch (err) {
    next(err);
  }
};

const getDriveRequests = async (req, res, next) => {
  try {
    const hr = await User.findById(req.userId);
    if (!hr || hr.role !== "hr") return next(createError(403, "Access denied!"));

    const DriveDataRequest = require("../models/DriveDataRequest");
    const { jobId } = req.params;

    const requests = await DriveDataRequest.find({ jobId, hrId: hr._id }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
};

const fulfillRequest = async (req, res, next) => {
  try {
    const hr = await User.findById(req.userId);
    if (!hr || hr.role !== "hr") return next(createError(403, "Access denied!"));

    const DriveDataRequest = require("../models/DriveDataRequest");
    const { requestId } = req.params;

    const request = await DriveDataRequest.findById(requestId);
    if (!request) return next(createError(404, "Request not found!"));

    if (request.hrId.toString() !== hr._id.toString()) {
      return next(createError(403, "You can only fulfill requests for your own drives!"));
    }

    request.status = "fulfilled";
    request.fulfilledAt = new Date();
    await request.save();

    res.status(200).json({ message: "Request fulfilled successfully!", request });
  } catch (err) {
    next(err);
  }
};

const pushDriveDataToPO = async (req, res, next) => {
  try {
    const hr = await User.findById(req.userId);
    if (!hr || hr.role !== "hr") return next(createError(403, "Access denied!"));

    const DriveDataRequest = require("../models/DriveDataRequest");
    const Job = require("../models/Job");
    const { jobId, requestedStage } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return next(createError(404, "Job not found!"));

    if (job.hrId.toString() !== hr._id.toString()) {
      return next(createError(403, "Access denied! This drive belongs to another recruiter."));
    }

    if (!job.isOnCampus || !job.exclusivePO) {
      return next(createError(400, "Proactive sharing is only for On-Campus drives with an assigned PO."));
    }

    // Check if there is an existing pending request for this stage
    let request = await DriveDataRequest.findOne({ 
      jobId, 
      hrId: hr._id, 
      requestedStage, 
      status: "pending" 
    });

    if (request) {
      request.status = "fulfilled";
      request.fulfilledAt = new Date();
      await request.save();
    } else {
      // Create a new "self-fulfilled" request record
      const po = await User.findById(job.exclusivePO);
      if (!po) return next(createError(404, "Placement Officer not found!"));

      request = new DriveDataRequest({
        jobId,
        poId: po._id,
        hrId: hr._id,
        requestedStage,
        university: po.university,
        status: "fulfilled",
        isProactive: true,
        fulfilledAt: new Date()
      });
      await request.save();
    }

    // Notify PO about the shared data
    const Notification = require("../models/Notification");
    const poNotification = new Notification({
      userId: request.poId,
      type: "DRIVE_DATA_FULFILLED",
      title: request.isProactive ? "New Candidate List Shared" : "Requested List Shared",
      message: request.isProactive 
        ? `HR ${hr.username} has proactively shared the ${requestedStage} list for ${job.jobRole}.`
        : `HR ${hr.username} has fulfilled your request for the ${requestedStage} list for ${job.jobRole}.`,
      link: `/po-dashboard`,
      metadata: {
        requestId: request._id,
        jobId: job._id,
        hrId: hr._id,
        isProactive: request.isProactive
      }
    });
    await poNotification.save();

    const io = req.app.get("io");
    if (io) {
      io.to(request.poId.toString()).emit("notification", {
        type: "DRIVE_DATA_FULFILLED",
        message: request.isProactive 
          ? `HR ${hr.username} has shared the ${requestedStage} list for ${job.jobRole}.`
          : `HR ${hr.username} has shared the ${requestedStage} list for ${job.jobRole}.`,
        jobId: job._id
      });
    }

    res.status(200).json({ message: `The ${requestedStage} list has been shared with the Placement Officer.`, request });
  } catch (err) {
    next(err);
  }
};

module.exports = { 
  searchStudents, 
  getCandidateProfile, 
  getPOByUniversity, 
  getHRDirectory, 
  getPODirectory,
  getDriveRequests,
  fulfillRequest,
  pushDriveDataToPO
};
