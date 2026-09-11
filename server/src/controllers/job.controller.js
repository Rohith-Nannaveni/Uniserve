const Job = require("../models/Job");
const User = require("../models/User");
const Application = require("../models/Application");
const POShare = require("../models/POShare");
const createError = require("../utils/createError");
const { getEligibility } = require("./po.controller");

const parseNumericCTC = (ctcStr) => {
  if (ctcStr === null || ctcStr === undefined) return 0;
  if (typeof ctcStr === 'number') return ctcStr;
  if (typeof ctcStr !== 'string') return 0;
  
  // Extract number from strings like "12 LPA", "12,00,000", "12.5"
  const match = ctcStr.match(/(\d+(\.\d+)?)/);
  if (match) {
    return parseFloat(match[1]);
  }
  return 0;
};

const createJob = async (req, res, next) => {
  if (req.role !== "hr") return next(createError(403, "Only HRs can post jobs!"));
  try {
    const hr = await User.findById(req.userId);
    if (!hr) return next(createError(404, "User not found!"));
    if (hr.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended. You cannot post new jobs!"));
    }

    const jobData = { ...req.body, hrId: req.userId };
    
    // Auto-populate numericCtc for analytics and governance
    if (jobData.ctc && !jobData.numericCtc) {
      jobData.numericCtc = parseNumericCTC(jobData.ctc);
    }

    // If it's an on-campus job, it must be approved by the PO before going live
    if (jobData.isOnCampus) {
      jobData.status = "pending_po_approval";
    }

    const newJob = new Job(jobData);
    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (err) {
    next(err);
  }
};



// ... (keep createJob as is)

const getJobs = async (req, res, next) => {
  try {
    if (req.role === "student" && req.subscription !== "business" && !req.isAdmin) {
      return next(createError(403, "Job board is exclusive to Business Tier students!"));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter: Active status AND lastDate is greater than or equal to today AND NOT deleted
    const query = { 
      status: "active",
      isDeleted: { $ne: true },
      $or: [
        { lastDate: { $gte: today } },
        { lastDate: { $exists: false } },
        { lastDate: null }
      ]
    };

    // If student, check which ones they already applied to and filter exclusive jobs
    if (req.role === "student") {
      const user = await User.findById(req.userId);
      if (!user) return next(createError(404, "User not found!"));

      const rawJobs = await Job.find(query)
        .sort({ createdAt: -1 })
        .populate("hrId", "username hrVerification.companyName")
        .populate("exclusivePO", "university");
      
      const filteredJobs = rawJobs.filter(job => {
        // If it's an exclusive on-campus job, only show to students of that university
        if (job.isOnCampus && job.exclusivePO) {
          // Compare university names (case-insensitive)
          return job.exclusivePO.university?.toLowerCase() === user.university?.toLowerCase();
        }
        return true;
      });

      const applications = await Application.find({ studentId: req.userId });
      const appliedJobIds = applications.map(app => app.jobId.toString());
      
      const jobsWithStatus = await Promise.all(filteredJobs.map(async job => {
        const jobObj = job.toObject();
        jobObj.isApplied = appliedJobIds.includes(job._id.toString());
        
        // Include centralized eligibility engine results
        if (job.isOnCampus) {
          jobObj.eligibility = await getEligibility(user, job);
        } else {
          jobObj.eligibility = { isEligible: true };
        }
        
        return jobObj;
      }));
      return res.status(200).json(jobsWithStatus);
    }

    const jobs = await Job.find(query).sort({ createdAt: -1 }).populate("hrId", "username hrVerification.companyName");
    res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
};

const getHRJobs = async (req, res, next) => {
  if (req.role !== "hr" && !req.isAdmin) return next(createError(403, "HR access required!"));
  try {
    const jobs = await Job.find({ hrId: req.userId, isDeleted: { $ne: true } }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
};

const getJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate("hrId", "username email phone hrVerification.companyName hrVerification.isProfileVisible");
    if (!job) return next(createError(404, "Job not found!"));
    
    // If job is soft-deleted, only allow the HR who posted it, or an admin, or a student who applied, or a student whose university has it shared
    if (job.isDeleted && req.role === "student") {
      const application = await Application.findOne({ jobId: job._id, studentId: req.userId });
      if (!application) {
        // Also check if shared with their university
        const user = await User.findById(req.userId);
        const userUni = (user?.university || "").trim();
        if (!userUni) {
          return next(createError(410, "This job posting has been removed by the recruiter."));
        }

        const isShared = await POShare.findOne({ 
          jobId: job._id, 
          university: { $regex: userUni, $options: "i" } 
        });
        if (!isShared) {
          return next(createError(410, "This job posting has been removed by the recruiter."));
        }
      }
    }

    const jobObj = job.toObject();
    
    // Check if current student has applied
    if (req.role === "student") {
      const user = await User.findById(req.userId);
      const application = await Application.findOne({ jobId: job._id, studentId: req.userId });
      jobObj.isApplied = !!application;
      
      // Include centralized eligibility engine results
      if (job.isOnCampus) {
        jobObj.eligibility = await getEligibility(user, job);
      } else {
        jobObj.eligibility = { isEligible: true };
      }
    }

    res.status(200).json(jobObj);
  } catch (err) {
    next(err);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return next(createError(404, "Job not found!"));
    if (job.hrId.toString() !== req.userId && !req.isAdmin) return next(createError(403, "You can only update your own jobs!"));

    const hr = await User.findById(req.userId);
    if (hr?.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended. You cannot update jobs!"));
    }

    const jobData = { ...req.body };
    if (jobData.ctc && !jobData.numericCtc) {
      jobData.numericCtc = parseNumericCTC(jobData.ctc);
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, { $set: jobData }, { new: true });
    res.status(200).json(updatedJob);
  } catch (err) {
    next(err);
  }
};

const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return next(createError(404, "Job not found!"));
    if (job.hrId.toString() !== req.userId && !req.isAdmin) return next(createError(403, "You can only delete your own jobs!"));

    const hr = await User.findById(req.userId);
    if (hr?.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended. You cannot delete jobs!"));
    }

    // Soft delete
    job.isDeleted = true;
    job.deletedAt = new Date();
    await job.save();

    res.status(200).send("Job has been deleted.");
  } catch (err) {
    next(err);
  }
};

module.exports = { createJob, getJobs, getHRJobs, getJob, updateJob, deleteJob };
