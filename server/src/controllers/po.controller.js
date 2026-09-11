const User = require("../models/User");
const Job = require("../models/Job");
const Application = require("../models/Application");
const CollegeSettings = require("../models/CollegeSettings");
const POShare = require("../models/POShare");
const Notification = require("../models/Notification");
const createError = require("../utils/createError");

const shareJobBulk = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Only POs can share jobs!"));
    
    if (!po.university || !po.university.trim()) {
      return next(createError(400, "Your account does not have a university set. Please complete your profile."));
    }

    if (po.reliabilityStatus === "suspended") {
        return next(createError(403, "Your account is suspended. You cannot share jobs!"));
    }

    const job = await Job.findById(req.body.jobId);
    if (!job) return next(createError(404, "Job not found!"));

    // 1. Create a persistent record of this share
    const existingShare = await POShare.findOne({ poId: po._id, jobId: job._id });
    if (!existingShare) {
      const newShare = new POShare({
        poId: po._id,
        jobId: job._id,
        university: po.university
      });
      await newShare.save();
    }

    // 2. Find all students in this PO's university
    const students = await User.find({ 
      university: { $regex: po.university.trim(), $options: "i" }, 
      role: "student" 
    });

    // 3. Create persistent notifications for all students
    const notificationData = students.map(student => ({
      userId: student._id,
      type: "OFF_CAMPUS_SHARE",
      title: "New Opportunity Shared",
      message: `PO ${po.username} has shared an Off-Campus opportunity: ${job.jobRole} at ${job.companyName}`,
      link: `/job/${job._id}`,
      metadata: {
        jobId: job._id,
        poId: po._id,
        isOnCampus: false
      }
    }));

    if (notificationData.length > 0) {
      await Notification.insertMany(notificationData);
    }
    
    // 4. Send real-time notifications via Socket.io
    const io = req.app.get("io");
    if (io) {
      students.forEach(student => {
        io.to(student._id.toString()).emit("notification", {
          type: "OFF_CAMPUS_SHARE",
          message: `PO ${po.username} has shared an Off-Campus opportunity: ${job.jobRole} at ${job.companyName}`,
          jobId: job._id,
          isOnCampus: false
        });
      });
    }

    res.status(200).json({ message: `Job shared and saved for ${students.length} students.` });
  } catch (err) {
    next(err);
  }
};

const recommendStudent = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Only POs can recommend students!"));

    const student = await User.findById(req.params.studentId);
    if (!student || student.role !== "student" || (student.university || "").trim().toLowerCase() !== (po.university || "").trim().toLowerCase()) {
        return next(createError(404, "Student not found in your university!"));
    }

    // Only allow recommending Business tier students
    if (student.subscription !== "business") {
      return next(createError(403, "You can only recommend Business Tier students!"));
    }

    student.isRecommended = !student.isRecommended;
    await student.save();

    res.status(200).json({ message: `Student recommendation toggled to ${student.isRecommended}`, isRecommended: student.isRecommended });
  } catch (err) {
    next(err);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    const students = await User.find({ 
      university: { $regex: po.university.trim(), $options: "i" }, 
      role: "student" 
    });
    const businessStudents = students.filter(s => s.subscription === "business");

    // AVG ATS Score (All students)
    const totalAts = students.reduce((acc, s) => acc + (s.resumeData?.atsScore || 0), 0);
    const avgAts = students.length > 0 ? (totalAts / students.length).toFixed(1) : 0;

    // Placement Readiness (Only Business Tier students)
    const readyStudents = businessStudents.filter(s => {
      const ats = s.resumeData?.atsScore || 0;
      return ats > 70 && s.studentVerification?.status === "approved";
    });
    const readyCount = readyStudents.length;
    const readyPercentage = businessStudents.length > 0 ? Math.round((readyCount / businessStudents.length) * 100) : 0;

    // Placements Stats (Only Business Tier students)
    const placedStudents = businessStudents.filter(s => (s.currentHighestOnCampusOffer || 0) > 0);
    const placementRate = businessStudents.length > 0 ? Math.round((placedStudents.length / businessStudents.length) * 100) : 0;
    
    // Packages
    const packages = placedStudents.map(s => parseFloat(s.currentHighestOnCampusOffer) || 0).filter(p => p > 0);
    const avgPackage = packages.length > 0 ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1) : 0;

    // Brackets
    const brackets = {
      under5: packages.filter(p => p < 5).length,
      between5and10: packages.filter(p => p >= 5 && p <= 10).length,
      above10: packages.filter(p => p > 10).length
    };

    // Company Wise Hiring
    const companyStats = {};
    placedStudents.forEach(s => {
      const company = s.onCampusCompany || "Off-Campus / Other";
      if (!companyStats[company]) {
        companyStats[company] = {
          companyName: company,
          count: 0,
          students: []
        };
      }
      companyStats[company].count++;
      companyStats[company].students.push({
        _id: s._id,
        username: s.username,
        package: s.currentHighestOnCampusOffer || 0,
        offerType: s.onCampusOfferType || "Full-time",
        jobRole: s.onCampusJobRole || "N/A",
        atsScore: s.resumeData?.atsScore || 0,
        img: s.img,
        email: s.email // Added email for more comprehensive CSV data
      });
    });

    res.status(200).json({
      avgAts,
      readyCount,
      totalStudents: students.length,
      businessCount: businessStudents.length,
      readyPercentage,
      placementRate,
      avgPackage,
      brackets,
      companyStats: Object.values(companyStats),
      placedCount: placedStudents.length,
      unplacedCount: businessStudents.length - placedStudents.length,
      topTalent: [...students].sort((a,b) => (b.resumeData?.atsScore || 0) - (a.resumeData?.atsScore || 0)).slice(0, 5)
    });
  } catch (err) {
    next(err);
  }
};

const getStudents = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    // Guard: PO must have a university set to query students
    if (!po.university || !po.university.trim()) {
      return next(createError(400, "Your account does not have a university set. Please contact admin."));
    }

    const { tier, status } = req.query;

    // IMPORTANT: Do NOT filter by isPlacementReady here.
    // isPlacementReady is a student's opt-in flag for external HR discovery only.
    // POs are internal university officials and have administrative right to see ALL students.
    let query = { 
      university: { $regex: po.university.trim(), $options: "i" }, 
      role: "student",
      removedByPO: { $ne: true } // Exclude students withdrawn from placement by the PO
    };

    if (tier && tier !== "all") {
      query.subscription = tier;
    }

    let students = await User.find(query).sort({ username: 1 });

    // Build placement status first so we can filter by it
    let studentData = students.map(s => {
      let placementStatus = "Unplaced";
      if (s.subscription === "premium") {
        placementStatus = "Career Growth";
      } else if ((parseFloat(s.currentHighestOnCampusOffer) || 0) > 0) {
        placementStatus = "Placed";
      }
      return {
        ...s._doc,
        placementStatus,
        track: s.subscription === "business" ? "Placement Track" : "Skill Track"
      };
    });

    // Status filter applied after computing placementStatus
    if (status && status !== "all") {
      if (status === "placed") {
        studentData = studentData.filter(s => s.placementStatus === "Placed");
      } else if (status === "unplaced") {
        studentData = studentData.filter(s => s.placementStatus === "Unplaced");
      } else if (status === "career-growth") {
        studentData = studentData.filter(s => s.placementStatus === "Career Growth");
      }
    }

    res.status(200).json(studentData);
  } catch (err) {
    next(err);
  }
};

const setStudentGovernance = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));
    if (po.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended. You cannot manage campus drives!"));
    }

    const { studentId } = req.params;
    const { multiplier, allowedRoles, allowedCategories, isLocked, branch } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== "student" || (student.university || "").trim().toLowerCase() !== (po.university || "").trim().toLowerCase()) {
      return next(createError(404, "Student not found in your university!"));
    }

    if (branch !== undefined) student.branch = branch;

    student.governance = {
      multiplier: multiplier !== undefined ? multiplier : (student.governance?.multiplier || 0),
      allowedRoles: allowedRoles !== undefined ? allowedRoles : (student.governance?.allowedRoles || []),
      allowedCategories: allowedCategories !== undefined ? allowedCategories : (student.governance?.allowedCategories || []),
      isLocked: isLocked !== undefined ? isLocked : (student.governance?.isLocked || false),
    };

    await student.save();
    res.status(200).json({ message: "Governance settings updated successfully", governance: student.governance, branch: student.branch });
  } catch (err) {
    next(err);
  }
};

const getCollegeSettings = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    let settings = await CollegeSettings.findOne({ poId: po._id });
    if (!settings) {
      settings = new CollegeSettings({ poId: po._id });
      await settings.save();
    }

    res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
};

const updateCollegeSettings = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));
    if (po.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended. You cannot manage campus policies!"));
    }

    const { autoApplyMultiplier, globalMultiplierValue, branchRestrictions } = req.body;

    let settings = await CollegeSettings.findOne({ poId: po._id });
    if (!settings) {
      settings = new CollegeSettings({ poId: po._id });
    }

    if (autoApplyMultiplier !== undefined) settings.autoApplyMultiplier = autoApplyMultiplier;
    if (globalMultiplierValue !== undefined) settings.globalMultiplierValue = globalMultiplierValue;
    if (branchRestrictions !== undefined) settings.branchRestrictions = branchRestrictions;

    await settings.save();
    res.status(200).json({ message: "College settings updated successfully", settings });
  } catch (err) {
    next(err);
  }
};

const removeStudent = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));
    if (po.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended."));
    }

    const student = await User.findById(req.params.studentId);
    if (!student) return next(createError(404, "Student not found!"));

    if (!student.university || !student.university.toLowerCase().includes(po.university.trim().toLowerCase())) {
      return next(createError(403, "This student does not belong to your university."));
    }

    student.removedByPO = true;
    // Fire notification to student so they can respond
    student.poRemovalNotification = {
      isActive: true,
      poId: po._id,
      poName: po.username,
      removedAt: new Date(),
      studentResponse: "pending",
      readdRequestMessage: ""
    };
    await student.save();

    res.status(200).json({ message: `${student.username} has been removed from the placement directory.` });
  } catch (err) {
    next(err);
  }
};

const bulkRemoveStudents = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));
    if (po.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended."));
    }

    const { studentIds } = req.body;
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return next(createError(400, "No student IDs provided."));
    }

    // Notify each student individually and mark as removed
    const students = await User.find({
      _id: { $in: studentIds },
      university: { $regex: po.university.trim(), $options: "i" },
      role: "student"
    });

    const notification = {
      isActive: true,
      poId: po._id,
      poName: po.username,
      removedAt: new Date(),
      studentResponse: "pending",
      readdRequestMessage: ""
    };

    await Promise.all(students.map(s => {
      s.removedByPO = true;
      s.poRemovalNotification = notification;
      return s.save();
    }));

    res.status(200).json({ 
      message: `${students.length} student(s) removed from the placement directory.`,
      removedCount: students.length
    });
  } catch (err) {
    next(err);
  }
};

// PO: get all students who requested to be re-added
const getReaddRequests = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    const requests = await User.find({
      university: { $regex: po.university.trim(), $options: "i" },
      role: "student",
      removedByPO: true,
      "poRemovalNotification.studentResponse": "requested_readd"
    }).select("username img university branch subscription resumeData poRemovalNotification");

    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
};

// PO: approve or decline a re-add request
const readdStudent = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    const student = await User.findById(req.params.studentId);
    if (!student) return next(createError(404, "Student not found!"));

    const { action } = req.body; // "approve" or "decline"

    if (action === "approve") {
      student.removedByPO = false;
      student.poRemovalNotification = {
        isActive: false,
        studentResponse: "pending",
        readdRequestMessage: ""
      };
      await student.save();
      return res.status(200).json({ message: `${student.username} has been re-added to your placement directory.` });
    } else if (action === "decline") {
      // Keep removed but close the notification
      student.poRemovalNotification.studentResponse = "accepted"; // treat as accepted/closed
      student.poRemovalNotification.isActive = false;
      await student.save();
      return res.status(200).json({ message: `Re-add request from ${student.username} declined.` });
    }

    return next(createError(400, "Invalid action. Use 'approve' or 'decline'."));
  } catch (err) {
    next(err);
  }
};

const getUniversityJobBoard = async (req, res, next) => {
  try {
    const student = await User.findById(req.userId);
    if (!student || student.role !== "student") return next(createError(403, "Student access required!"));

    if (!student.university || !student.university.trim()) return res.status(200).json([]);

    // Find all jobs shared with this university
    const shares = await POShare.find({ 
      university: { $regex: student.university.trim(), $options: "i" },
      _id: { $nin: student.dismissedShares || [] }
    }).populate({
      path: 'jobId',
      populate: {
        path: 'hrId',
        select: 'username hrVerification.companyName'
      }
    }).populate('poId', 'username');

    // Filter out shares where the job might have been completely deleted from DB (unlikely with our setup but good practice)
    const validShares = shares.filter(share => share.jobId);

    // Map to a cleaner format with eligibility check
    const jobs = await Promise.all(validShares.map(async share => {
      const job = share.jobId.toObject();
      return {
        ...job,
        shareId: share._id,
        sharedBy: share.poId?.username,
        sharedAt: share.createdAt,
        isClosed: job.isDeleted || (job.lastDate && new Date(job.lastDate) < new Date()),
        eligibility: job.isOnCampus ? await getEligibility(student, share.jobId) : { isEligible: true }
      };
    }));

    res.status(200).json(jobs.sort((a, b) => b.sharedAt - a.sharedAt));
  } catch (err) {
    next(err);
  }
};

const getPOSharingHistory = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "PO access required!"));

    const shares = await POShare.find({ 
      poId: po._id,
      _id: { $nin: po.dismissedShares || [] }
    })
      .populate({
        path: 'jobId',
        select: 'companyName jobRole category lastDate isDeleted status restrictions ctc'
      })
      .sort({ createdAt: -1 });

    const history = shares.map(share => {
      if (!share.jobId) return null;
      const job = share.jobId;
      return {
        _id: job._id,
        shareId: share._id,
        companyName: job.companyName,
        jobRole: job.jobRole,
        category: job.category,
        lastDate: job.lastDate,
        isDeleted: job.isDeleted,
        status: job.status,
        restrictions: job.restrictions,
        ctc: job.ctc,
        sharedAt: share.createdAt,
        isClosed: job.isDeleted || (job.lastDate && new Date(job.lastDate) < new Date())
      };
    }).filter(h => h !== null);

    res.status(200).json(history);
  } catch (err) {
    next(err);
  }
};

const getPendingJobs = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    // Fetch both pending and active on-campus drives for this university
    // Subtask 1.4: Filter out jobs present in the PO's dismissedJobs list
    const jobs = await Job.find({ 
      exclusivePO: po._id, 
      status: { $in: ["pending_po_approval", "active"] },
      isDeleted: { $ne: true },
      _id: { $nin: po.dismissedJobs || [] }
    }).populate("hrId", "username hrVerification.companyName email");

    res.status(200).json(jobs);
  } catch (err) {
    next(err);
  }
};

const revokeDrive = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    const job = await Job.findById(req.params.jobId);
    if (!job) return next(createError(404, "Job not found!"));

    if (!job.exclusivePO || job.exclusivePO.toString() !== po._id.toString()) {
      return next(createError(403, "You can only revoke drives for your own university!"));
    }

    // Subtask 1.3: Only handle status transition from active to pending_po_approval
    if (job.status === "active") {
      job.status = "pending_po_approval";
      await job.save();
      // Remove the POShare entry so it disappears from student job boards
      await POShare.deleteOne({ poId: po._id, jobId: job._id });
      res.status(200).json({ message: "Drive revoked successfully and moved back to pending approvals." });
    } else {
      return next(createError(400, "Only live drives can be revoked."));
    }
  } catch (err) {
    next(err);
  }
};

const approveJob = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    if (!po.university || !po.university.trim()) {
      return next(createError(400, "Your university information is missing. Please update your profile."));
    }

    const job = await Job.findById(req.params.jobId);
    if (!job) return next(createError(404, "Job not found!"));

    if (!job.exclusivePO || job.exclusivePO.toString() !== po._id.toString()) {
      return next(createError(403, "You can only approve jobs for your own university!"));
    }

    const { onlyUnplaced } = req.body;
    const isFirstTimeApproval = job.status === "pending_po_approval";

    // 1. Update job status and restrictions
    job.status = "active";
    if (onlyUnplaced !== undefined) {
      job.restrictions.onlyUnplaced = onlyUnplaced;
    }
    await job.save();

    // 2. Create a persistent record of this share so it appears on the university job board
    const existingShare = await POShare.findOne({ poId: po._id, jobId: job._id });
    if (!existingShare) {
      const newShare = new POShare({
        poId: po._id,
        jobId: job._id,
        university: po.university
      });
      await newShare.save();
    }

    // 3. Notify students ONLY if it's the first time approval
    if (isFirstTimeApproval) {
      const students = await User.find({ 
        university: { $regex: po.university.trim(), $options: "i" }, 
        role: "student" 
      });

      const notificationData = students.map(student => ({
        userId: student._id,
        type: "ON_CAMPUS_DRIVE",
        title: "New Campus Drive Live",
        message: `${job.companyName} has launched an On-Campus drive for ${job.jobRole}.`,
        link: `/job/${job._id}`,
        metadata: {
          jobId: job._id,
          poId: po._id,
          isOnCampus: true
        }
      }));

      if (notificationData.length > 0) {
        await Notification.insertMany(notificationData);
      }

      // Real-time via socket
      const io = req.app.get("io");
      if (io) {
        students.forEach(student => {
          io.to(student._id.toString()).emit("notification", {
            type: "ON_CAMPUS_DRIVE",
            message: `${job.companyName} has launched an On-Campus drive for ${job.jobRole}.`,
            jobId: job._id,
            isOnCampus: true
          });
        });
      }
    }

    res.status(200).json({ 
      message: isFirstTimeApproval ? "Job approved and is now live for students." : "Job restrictions updated successfully.", 
      job 
    });
  } catch (err) {
    next(err);
  }
};

const dismissJob = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    const { jobId } = req.params;
    if (!po.dismissedJobs.includes(jobId)) {
      po.dismissedJobs.push(jobId);
      await po.save();
    }

    res.status(200).json({ message: "Drive entry hidden from your Command Center." });
  } catch (err) {
    next(err);
  }
};

const updateStudentPlacementStatus = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    const { studentId } = req.params;
    const { status, company, role, packageAmount, offerType } = req.body;

    const student = await User.findById(studentId);
    if (!student || student.role !== "student" || (student.university || "").trim().toLowerCase() !== (po.university || "").trim().toLowerCase()) {
      return next(createError(404, "Student not found in your university!"));
    }

    if (status === "unplaced") {
      student.currentHighestOnCampusOffer = 0;
      student.onCampusCompany = "";
      student.onCampusJobRole = "";
      student.onCampusOfferType = "";
    } else if (status === "placed") {
      if (!company || !role || !packageAmount) {
        return next(createError(400, "Company, Role, and Package are required for manual placement."));
      }
      student.currentHighestOnCampusOffer = parseFloat(packageAmount);
      student.onCampusCompany = company;
      student.onCampusJobRole = role;
      student.onCampusOfferType = offerType || "Full Time";

      // Auto-apply PO Multiplier Policy if configured
      const CollegeSettings = require("../models/CollegeSettings");
      const settings = await CollegeSettings.findOne({ poId: po._id });
      if (settings?.autoApplyMultiplier) {
        student.governance = {
          ...(student.governance || {}),
          multiplier: settings.globalMultiplierValue
        };
      }
    } else {
      return next(createError(400, "Invalid status. Use 'placed' or 'unplaced'."));
    }

    await student.save();
    res.status(200).json({ message: `Student status updated to ${status}.`, student });
  } catch (err) {
    next(err);
  }
};

const dismissShare = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    const { shareId } = req.params;
    if (!user.dismissedShares.includes(shareId)) {
      user.dismissedShares.push(shareId);
      await user.save();
    }

    res.status(200).json({ message: "Item dismissed from your view." });
  } catch (err) {
    next(err);
  }
};

const globalCampusReset = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Only POs can perform a campus reset!"));
    
    if (po.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended. You cannot perform a reset!"));
    }

    if (!po.university || !po.university.trim()) {
      return next(createError(400, "University information missing from your profile."));
    }

    const universityName = po.university.trim();

    // 1. Reset all students and POs in the university to UNPLACED/Clear UI preferences
    // Subtask 2.1.2: Clear placement fields
    // Subtask 2.1.4: Clear dismissed arrays for everyone in the campus
    await User.updateMany(
      { 
        university: { $regex: universityName, $options: "i" }, 
        role: { $in: ["student", "po"] }
      },
      {
        $set: {
          currentHighestOnCampusOffer: 0,
          onCampusCompany: "",
          onCampusJobRole: "",
          onCampusOfferType: "",
          governance: {
            multiplier: 0,
            allowedRoles: [],
            allowedCategories: [],
            isLocked: false
          },
          dismissedShares: [],
          dismissedJobs: []
        }
      }
    );

    // 3. Delete all persistent shares (resets My Shares and University Shared boards)
    // Subtask 2.1.3: Permanently delete all POShare records
    await POShare.deleteMany({ 
      university: { $regex: universityName, $options: "i" } 
    });

    // 4. Delete all applications for On-Campus jobs belonging to this university
    // (Preserving data integrity across season resets)
    const onCampusJobs = await Job.find({ exclusivePO: po._id });
    const jobIds = onCampusJobs.map(j => j._id);
    
    if (jobIds.length > 0) {
      await Application.deleteMany({ jobId: { $in: jobIds } });
    }

    res.status(200).json({ 
      message: "Campus reset completed successfully. Students are unplaced, sharing history cleared, and UI preferences restored." 
    });
  } catch (err) {
    next(err);
  }
};

const getEligibility = async (student, job) => {
  // 1. Standardized Branch Eligibility (Applies to ALL Jobs)
  if (job.eligibleBranches?.length > 0 && !job.eligibleBranches.includes("Any Branch")) {
    const studentBranch = (student.branch || "").trim();
    if (!studentBranch) {
      const message = student.university 
        ? "Your academic branch is not set in your profile. Please submit a branch change request to your Placement Officer to apply for jobs."
        : "Your academic branch is not set in your profile. Please set your branch in your profile settings to apply for jobs.";
      return {
        isEligible: false,
        reason: "Profile Incomplete",
        message
      };
    }

    const isBranchEligible = job.eligibleBranches.some(b => b.toLowerCase().trim() === studentBranch.toLowerCase());
    if (!isBranchEligible) {
      return {
        isEligible: false,
        reason: "Branch Ineligible",
        message: `Restricted: This opportunity is only open to students from the following branches: ${job.eligibleBranches.join(", ")}. Your registered branch is ${studentBranch}.`
      };
    }
  }

  if (!job.isOnCampus) return { isEligible: true };

  // Hierarchy 1: Unplaced Only Check
  if (job.restrictions?.onlyUnplaced && (student.currentHighestOnCampusOffer || 0) > 0) {
    return { 
      isEligible: false, 
      reason: "Unplaced Only", 
      message: `Restricted: This drive is reserved for unplaced students. You already hold a placement of ${student.currentHighestOnCampusOffer} LPA at ${student.onCampusCompany || "a company"}.` 
    };
  }

  // Hierarchy 2: Multiplier Rule
  let activeMultiplier = student.governance?.multiplier || 0;
  
  // Fetch global settings if student individual multiplier is 0
  if (activeMultiplier === 0 && job.exclusivePO) {
    const settings = await CollegeSettings.findOne({ poId: job.exclusivePO });
    if (settings?.autoApplyMultiplier) {
      activeMultiplier = settings.globalMultiplierValue || 0;
    }
  }

  if (activeMultiplier > 0 && (student.currentHighestOnCampusOffer || 0) > 0) {
    const requiredPackage = student.currentHighestOnCampusOffer * activeMultiplier;
    const jobPackage = job.numericCtc || 0;
    if (jobPackage < requiredPackage) {
      return { 
        isEligible: false, 
        reason: `${activeMultiplier}X Rule`, 
        message: `Restricted: Your current placement of ${student.currentHighestOnCampusOffer} LPA requires a ${activeMultiplier}X package (${requiredPackage}+ LPA) to apply for further on-campus drives.` 
      };
    }
  }

  // Hierarchy 3: Account Locked
  if (student.governance?.isLocked) {
    return { 
      isEligible: false, 
      reason: "Locked", 
      message: "Restricted: Your placement account is currently locked. Please contact the Placement Office for further details." 
    };
  }

  // Hierarchy 4: Role/Category Restrictions
  // Individual Roles
  if (student.governance?.allowedRoles?.length > 0) {
    const isAllowed = student.governance.allowedRoles.some(role => 
      job.jobRole.toLowerCase().includes(role.toLowerCase())
    );
    if (!isAllowed) {
      return { 
        isEligible: false, 
        reason: "Role Restriction", 
        message: `Restricted: Your profile is currently limited to ${student.governance.allowedRoles.join(", ")} roles by the Placement Office.` 
      };
    }
  }

  // Individual Categories
  if (student.governance?.allowedCategories?.length > 0) {
    if (!student.governance.allowedCategories.includes(job.category)) {
      return { 
        isEligible: false, 
        reason: "Category Restriction", 
        message: `Restricted: You are only permitted to apply for ${student.governance.allowedCategories.join(", ")} drives at this time.` 
      };
    }
  }

  // Global Branch Restrictions (Hierarchy 4 Continued)
  if (job.exclusivePO) {
    const settings = await CollegeSettings.findOne({ poId: job.exclusivePO });
    if (settings?.branchRestrictions?.length > 0) {
      const studentBranch = student.branch || "";
      const branchRule = settings.branchRestrictions.find(r => r.branch.toLowerCase() === studentBranch.toLowerCase());
      if (branchRule && branchRule.allowedRoles?.length > 0) {
        const isRoleAllowed = branchRule.allowedRoles.some(role => 
          job.jobRole.toLowerCase().includes(role.toLowerCase())
        );
        if (!isRoleAllowed) {
          return { 
            isEligible: false, 
            reason: "Branch Policy", 
            message: `Global Policy: The ${studentBranch} branch is restricted to applying for the following roles: ${branchRule.allowedRoles.join(", ")}` 
          };
        }
      }
    }
  }

  return { isEligible: true };
};

module.exports = { 
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
  getEligibility,
  checkStudentEligibility: async (req, res, next) => {
    try {
      const { jobId } = req.params;
      const Job = require("../models/Job");
      const user = await User.findById(req.userId);
      const job = await Job.findById(jobId);

      if (!user || !job) {
        return res.status(404).json({ isEligible: false, message: "User or Job not found" });
      }

      const result = await getEligibility(user, job);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  createDataRequest: async (req, res, next) => {
    try {
      const po = await User.findById(req.userId);
      if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

      const { jobId, requestedStage } = req.body;
      const Job = require("../models/Job");
      const DriveDataRequest = require("../models/DriveDataRequest");

      const job = await Job.findById(jobId);
      if (!job) return next(createError(404, "Job not found!"));

      if (!job.isOnCampus) {
        return next(createError(400, "Requests are only allowed for On-Campus drives!"));
      }

      // Check if a request already exists for this jobId and stage
      const existing = await DriveDataRequest.findOne({ jobId, poId: po._id, requestedStage });
      if (existing) {
        return next(createError(400, `A request for the ${requestedStage} list has already been sent.`));
      }

      const newRequest = new DriveDataRequest({
        jobId,
        poId: po._id,
        hrId: job.hrId,
        requestedStage,
        university: po.university
      });

      await newRequest.save();

      // Notify HR about the request
      const Notification = require("../models/Notification");
      const hrNotification = new Notification({
        userId: job.hrId,
        type: "DRIVE_DATA_REQUEST",
        title: "Candidate List Requested",
        message: `PO ${po.username} from ${po.university} has requested the ${requestedStage} list for ${job.jobRole}.`,
        link: `/manage-jobs/${job._id}/applicants`,
        metadata: {
          requestId: newRequest._id,
          jobId: job._id,
          poId: po._id
        }
      });
      await hrNotification.save();

      const io = req.app.get("io");
      if (io) {
        io.to(job.hrId.toString()).emit("notification", {
          type: "DRIVE_DATA_REQUEST",
          message: `PO ${po.username} from ${po.university} has requested the ${requestedStage} list for ${job.jobRole}.`,
          jobId: job._id
        });
      }

      res.status(201).json({ message: "Request sent to HR successfully!", request: newRequest });
    } catch (err) {
      next(err);
    }
  },

  getRequestedListData: async (req, res, next) => {
    try {
      const po = await User.findById(req.userId);
      if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

      const { requestId } = req.params;
      const DriveDataRequest = require("../models/DriveDataRequest");
      const Application = require("../models/Application");

      const request = await DriveDataRequest.findById(requestId);
      if (!request) return next(createError(404, "Request not found!"));

      const Job = require("../models/Job");
      const job = await Job.findById(request.jobId);

      if (request.university !== po.university) {
        return next(createError(403, "Access denied! This request belongs to another university."));
      }

      if (request.status !== "fulfilled") {
        return next(createError(400, "This request has not been fulfilled by the HR yet."));
      }

      const stageMap = {
        "Applied": "pending",
        "Shortlisted": "shortlisted",
        "Interview": "interview",
        "Hired": "hired"
      };

      const targetStatus = stageMap[request.requestedStage];
      
      const applicants = await Application.find({ 
        jobId: request.jobId, 
        status: targetStatus 
      }).populate("studentId", "username email branch university");

      const standardizedData = applicants.map(app => ({
        name: app.studentId?.username || "N/A",
        email: app.studentId?.email || "N/A",
        branch: app.studentId?.branch || "N/A",
        cgpa: app.submittedCgpa || "N/A",
        atsScore: app.atsScore || 0,
        skills: app.submittedSkills || [],
        status: app.status.toUpperCase(),
        offeredPackage: job?.ctc || app.offeredPackage || "N/A",
        offerType: app.offerType || job?.category || "N/A"
      }));

      res.status(200).json(standardizedData);
    } catch (err) {
      next(err);
    }
  },

  getDriveRequestsForPO: async (req, res, next) => {
    try {
      const po = await User.findById(req.userId);
      if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

      const { jobId } = req.params;
      const DriveDataRequest = require("../models/DriveDataRequest");

      const requests = await DriveDataRequest.find({
        jobId,
        university: po.university
      });

      res.status(200).json(requests);
    } catch (err) {
      next(err);
    }
  }
};
