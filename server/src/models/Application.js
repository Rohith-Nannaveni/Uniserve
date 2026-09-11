const mongoose = require("mongoose");
const { Schema } = mongoose;

const applicationSchema = new Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedCgpa: {
      type: Number,
      required: false,
    },
    submittedSkills: {
      type: [String],
      default: [],
    },
    resumeUrl: {
      type: String,
      required: false,
    },
    atsScore: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "shortlisted", "rejected", "interview", "hired"],
      default: "pending",
    },
    recruitmentDetails: {
      type: String,
      required: false, // For test links, instructions, etc.
    },
    additionalDocs: {
      type: [String],
      default: [],
    },
    offeredPackage: {
      type: Number,
      required: false,
    },
    offerType: {
      type: String,
      enum: ["Full-time", "Internship", "PPO", ""],
      default: "",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Application", applicationSchema);
