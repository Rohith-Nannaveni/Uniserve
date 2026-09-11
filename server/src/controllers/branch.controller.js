const User = require("../models/User");
const createError = require("../utils/createError");

// Student: Submit or Update Branch Change Request
const submitBranchRequest = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== "student") return next(createError(403, "Only students can submit branch requests!"));
    
    // Only Business tier students allowed for this feature
    if (user.subscription !== "business") {
      return next(createError(403, "This feature is exclusive to Business Tier students!"));
    }

    const { requestedBranch, requestedSpecialization, proof } = req.body;

    user.branchChangeRequest = {
      requestedBranch,
      requestedSpecialization,
      proof,
      status: "pending",
      rejectionReason: "",
      updatedAt: new Date()
    };

    await user.save();
    res.status(200).json({ message: "Branch change request submitted successfully!", request: user.branchChangeRequest });
  } catch (err) {
    next(err);
  }
};

// PO: Get all pending branch requests for their university
const getPendingBranchRequests = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    if (!po.university) return next(createError(400, "University not set for your profile!"));

    const requests = await User.find({
      university: { $regex: po.university.trim(), $options: "i" },
      role: "student",
      "branchChangeRequest.status": "pending"
    }).select("username img branch specialization branchChangeRequest");

    res.status(200).json(requests);
  } catch (err) {
    next(err);
  }
};

// PO: Approve or Reject Branch Request
const handleBranchRequestDecision = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    const { studentId } = req.params;
    const { action, rejectionReason } = req.body; // action: "approve" or "reject"

    const student = await User.findById(studentId);
    if (!student || student.role !== "student" || (student.university || "").trim().toLowerCase() !== (po.university || "").trim().toLowerCase()) {
      return next(createError(404, "Student not found in your university!"));
    }

    if (!student.branchChangeRequest || student.branchChangeRequest.status !== "pending") {
      return next(createError(400, "No pending request found for this student."));
    }

    if (action === "approve") {
      student.branch = student.branchChangeRequest.requestedBranch;
      student.specialization = student.branchChangeRequest.requestedSpecialization;
      student.branchChangeRequest.status = "approved";
      student.branchChangeRequest.updatedAt = new Date();
    } else if (action === "reject") {
      if (!rejectionReason) return next(createError(400, "Rejection reason is required!"));
      student.branchChangeRequest.status = "rejected";
      student.branchChangeRequest.rejectionReason = rejectionReason;
      student.branchChangeRequest.updatedAt = new Date();
    } else {
      return next(createError(400, "Invalid action. Use 'approve' or 'reject'."));
    }

    await student.save();
    res.status(200).json({ message: `Request ${action}d successfully.`, student });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitBranchRequest,
  getPendingBranchRequests,
  handleBranchRequestDecision
};
