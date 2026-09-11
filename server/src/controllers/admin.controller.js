const User = require("../models/User");
const createError = require("../utils/createError");

const getPendingVerifications = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Admin only!"));

    const pendingHR = await User.find({ "hrVerification.status": "pending" });
    const pendingPO = await User.find({ "poVerification.status": "pending" });
    const pendingStudents = await User.find({ "studentVerification.status": "pending" });

    res.status(200).json({ pendingHR, pendingPO, pendingStudents });
  } catch (err) {
    next(err);
  }
};

const resolveVerification = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Admin only!"));

    const { userId, type, status, rejectionReason } = req.body; // type: hr, po, student
    const user = await User.findById(userId);
    if (!user) return next(createError(404, "User not found!"));

    if (type === "hr") {
      user.hrVerification.status = status;
      if (status === "rejected") {
        user.hrVerification.rejectionReason = rejectionReason;
      } else if (status === "approved") {
        user.hrVerification.rejectionReason = "";
        user.trustBadge = "verified";
      }
    } else if (type === "po") {
      user.poVerification.status = status;
      if (status === "rejected") {
        user.poVerification.rejectionReason = rejectionReason;
      } else if (status === "approved") {
        user.poVerification.rejectionReason = "";
        user.trustBadge = "verified";
      }
    } else if (type === "student") {
      user.studentVerification.status = status;
      if (status === "rejected") {
        user.studentVerification.rejectionReason = rejectionReason;
      } else if (status === "approved") {
        user.studentVerification.rejectionReason = "";
        
        // Find latest pending subscription order for this user
        const SubscriptionOrder = require("../models/SubscriptionOrder");
        const latestOrder = await SubscriptionOrder.findOne({ userId: userId, paymentStatus: "pending" }).sort({ createdAt: -1 });
        
        if (latestOrder) {
          latestOrder.paymentStatus = "paid";
          await latestOrder.save();
          
          user.subscription = latestOrder.plan;
          
          // 30 days from now
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          user.subscriptionExpiry = expiryDate;
          
          user.trustBadge = latestOrder.plan === "business" ? "expert" : "premium";

          // CRITICAL FIX: Propagate university from the SubscriptionOrder to the User.
          // Without this, the student's university field stays null after admin approval,
          // making them invisible in the PO's student directory which queries by university.
          if (latestOrder.university) {
            user.university = latestOrder.university;
          }
        } else {
          // If no order found (manual admin tier set), still approve the verification.
          // University should already be on the user — no order to pull it from.
          user.trustBadge = user.subscription === "business" ? "expert" : "premium";
        }
      }
    }

    await user.save();
    res.status(200).send(`Verification status updated to ${status}.`);
  } catch (err) {
    next(err);
  }
};

const getPendingAppeals = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Admin only!"));

    const users = await User.find({ appealStatus: "pending" })
      .select("username email role reliabilityStatus suspensionReason suspensionDuration appealReason appealDocuments appealStatus university hrVerification");

    res.status(200).json(users);
  } catch (err) {
    next(err);
  }
};

const resolveAppeal = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Admin only!"));

    const { userId, action, suspensionReason, suspensionDuration } = req.body; // action: unsuspend, punishment, approve (unban), reject
    const user = await User.findById(userId);
    if (!user) return next(createError(404, "User not found!"));

    if (action === "unsuspend" || action === "approve") {
      user.reliabilityStatus = "normal";
      user.isBanned = false;
      user.suspensionReason = "";
      user.suspensionDuration = "";
      user.appealStatus = "resolved";
    } else if (action === "punishment" || action === "reject") {
      if (action === "punishment") {
        user.suspensionReason = suspensionReason || user.suspensionReason;
        user.suspensionDuration = suspensionDuration || user.suspensionDuration;
      }
      user.appealStatus = "resolved"; // Admin has responded to the appeal
    }

    await user.save();
    res.status(200).send(`Appeal resolved with action: ${action}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { getPendingVerifications, resolveVerification, getPendingAppeals, resolveAppeal };
