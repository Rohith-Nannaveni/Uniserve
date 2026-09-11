const Report = require("../models/Report");
const User = require("../models/User");
const Proposal = require("../models/Proposal");
const createError = require("../utils/createError");

const createReport = async (req, res, next) => {
  try {
    const { reportedId, proposalId, category, reason, proofs } = req.body;

    const newReport = new Report({
      reporterId: req.userId,
      reportedId,
      proposalId,
      category,
      reason,
      proofs: proofs || [],
    });

    await newReport.save();
    res.status(201).send("Report submitted successfully and is under review.");
  } catch (err) {
    next(err);
  }
};

const getReportsForAdmin = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can view reports!"));

    const reports = await Report.find()
      .populate("reporterId", "username email role img university hrVerification")
      .populate("reportedId", "username email role img reliabilityStatus university hrVerification")
      .populate("proposalId")
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (err) {
    next(err);
  }
};

const submitCounterResponse = async (req, res, next) => {
  try {
    const { response, responseProofs } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) return next(createError(404, "Report not found!"));
    if (report.reportedId.toString() !== req.userId) {
      return next(createError(403, "You can only respond to reports against you!"));
    }

    report.response = response;
    report.responseProofs = responseProofs || [];
    report.status = "under_review";
    await report.save();

    res.status(200).send("Counter-response submitted successfully.");
  } catch (err) {
    next(err);
  }
};

const resolveReport = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can resolve reports!"));

    const { action, adminNote } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) return next(createError(404, "Report not found!"));

    report.adminAction = action;
    report.adminNote = adminNote;
    report.status = action === "dismissal" ? "dismissed" : "resolved";

    if (action === "warning") {
      await User.findByIdAndUpdate(report.reportedId, { reliabilityStatus: "low" });
    } else if (action === "suspension") {
      await User.findByIdAndUpdate(report.reportedId, { reliabilityStatus: "suspended" });
    }

    await report.save();
    res.status(200).send("Report resolved successfully.");
  } catch (err) {
    next(err);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const reports = await Report.find({ reportedId: req.userId })
      .populate("reporterId", "username role")
      .populate("proposalId")
      .sort({ createdAt: -1 });
    
    res.status(200).json(reports);
  } catch (err) {
    next(err);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can delete reports!"));

    const report = await Report.findById(req.params.id);
    if (!report) return next(createError(404, "Report not found!"));

    await Report.findByIdAndDelete(req.params.id);
    res.status(200).send("Report entry deleted permanently.");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReport,
  getReportsForAdmin,
  submitCounterResponse,
  resolveReport,
  getMyReports,
  deleteReport
};
