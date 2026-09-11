const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function() {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    img: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: false,
    },
    desc: {
      type: String,
      required: false,
    },
    isVendor: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["student", "hr", "po"],
      default: "student",
    },
    university: {
      type: String,
      required: false,
    },
    branch: {
      type: String,
      required: false,
    },
    specialization: {
      type: String,
      required: false,
    },
    branchChangeRequest: {
      requestedBranch: { type: String, required: false },
      requestedSpecialization: { type: String, required: false },
      proof: { type: String, required: false },
      status: { type: String, enum: ["pending", "approved", "rejected", null], default: null },
      rejectionReason: { type: String, required: false },
      updatedAt: { type: Date }
    },
    graduationYear: {
      type: Number,
      required: false,
    },
    trustBadge: {
      type: String,
      enum: ["none", "verified", "premium", "pro", "expert"],
      default: "none",
    },
    subscription: {
      type: String,
      enum: ["normal", "premium", "business"],
      default: "normal",
    },
    subscriptionExpiry: {
      type: Date,
      required: false,
    },
    resumeData: {
      url: { type: String, required: false },
      atsScore: { type: Number, default: 0 },
      tips: { type: [String], default: [] },
      parsedSkills: { type: [String], default: [] },
      gapAnalysis: {
        missingSkills: { type: [String], default: [] },
        focusAreas: { type: [String], default: [] },
        roleFitScore: { type: Number, default: 0 }
      }
    },
    qrCode: {
      type: String,
      required: false,
    },
    otp: {
      type: String,
      required: false,
    },
    otpExpiry: {
      type: Date,
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    hrVerification: {
      status: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
      proof: { type: String, required: false },
      rejectionReason: { type: String, required: false },
      companyName: { type: String, required: false },
      workEmail: { type: String, required: false },
      isProfileVisible: { type: Boolean, default: false },
    },
    poVerification: {
      status: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
      proof: { type: String, required: false }, // Official ID
      authorityLetter: { type: String, required: false }, // Appointment Letter
      rejectionReason: { type: String, required: false },
      department: { type: String, required: false },
      isProfileVisible: { type: Boolean, default: false },
    },
    studentVerification: {
      collegeId: { type: String, required: false },
      transcripts: { type: [String], default: [] },
      status: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "none" },
      rejectionReason: { type: String, required: false },
    },
    isPlacementReady: {
      type: Boolean,
      default: false,
    },
    isRecommended: {
      type: Boolean,
      default: false,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    reliabilityStatus: {
      type: String,
      enum: ["normal", "low", "suspended"],
      default: "normal",
    },
    suspensionReason: {
      type: String,
      required: false,
    },
    suspensionDuration: {
      type: String, // e.g., "30 days"
      required: false,
    },
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service"
    }],
    appealReason: {
      type: String,
      required: false,
    },
    appealStatus: {
      type: String,
      enum: ["none", "pending", "resolved"],
      default: "none",
    },
    appealDocuments: {
      type: [String],
      required: false,
    },
    isRestricted: {
      type: Boolean,
      default: false,
    },
    restrictionReason: {
      type: String,
      required: false,
    },
    restrictedOrders: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Order",
      default: [],
    },
    currentHighestOnCampusOffer: {
      type: Number,
      default: 0,
    },
    onCampusCompany: {
      type: String,
      default: "",
    },
    onCampusJobRole: {
      type: String,
      default: "",
    },
    onCampusOfferType: {
      type: String,
      default: "",
    },
    governance: {
      multiplier: { type: Number, default: 0 }, // 0 means no multiplier restriction
      allowedRoles: { type: [String], default: [] }, // empty means all roles allowed
      allowedCategories: { type: [String], default: [] }, // empty means all categories allowed
      isLocked: { type: Boolean, default: false }, // if true, student cannot apply to any job
    },
    removedByPO: {
      type: Boolean,
      default: false,
    },
    // Notification sent to student when PO removes their entry
    poRemovalNotification: {
      isActive:  { type: Boolean, default: false },
      poId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      poName:    { type: String, default: "" },
      removedAt: { type: Date },
      // Student's response to the removal
      studentResponse: {
        type: String,
        enum: ["pending", "accepted", "requested_readd"],
        default: "pending"
      },
      readdRequestMessage: { type: String, default: "" }
    },
    dismissedShares: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "POShare"
    }],
    dismissedJobs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    }],
    profileUpdateRequests: [{
      requestedChanges: { type: Map, of: Schema.Types.Mixed },
      proofs: [{
        url: { type: String, required: true },
        label: { type: String, required: true }
      }],
      status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
      rejectionReason: { type: String, required: false },
      createdAt: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
