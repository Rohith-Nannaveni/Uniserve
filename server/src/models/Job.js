const mongoose = require("mongoose");
const { Schema } = mongoose;

const jobSchema = new Schema(
  {
    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: false, // e.g., Regular Internship, Full Time
    },
    dateOfVisit: {
      type: String,
      required: false,
    },
    eligibleBranches: {
      type: [String],
      required: false,
    },
    eligibilityCriteria: {
      cgpaX: { type: Number, default: 0 },
      cgpaXII: { type: Number, default: 0 },
      cgpaUG: { type: Number, default: 0 },
      noArrears: { type: Boolean, default: false },
    },
    ctc: {
      type: String,
      required: false,
    },
    numericCtc: {
      type: Number,
      required: false, // For mathematical calculations and filtering
    },
    stipend: {
      type: String,
      required: false,
    },
    lastDate: {
      type: Date,
      required: false,
    },
    website: {
      type: String,
      required: false,
    },
    location: {
      type: String,
      required: false,
    },
    jobRole: {
      type: String,
      required: true,
    },
    jobDescription: {
      type: String,
      required: false,
    },
    hiringWorkflow: {
      type: String,
      required: false,
    },
    skillsRequired: {
      type: [String],
      required: false,
    },
    status: {
      type: String,
      enum: ["active", "closed", "pending_po_approval"],
      default: "active",
    },
    exclusivePO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isOnCampus: {
      type: Boolean,
      default: false,
    },
    driveSchedule: [
      {
        roundName: { type: String, required: true },
        date: { type: Date, required: false },
        mode: { type: String, enum: ["In-person", "Virtual"], default: "Virtual" },
        details: { type: String, required: false },
      }
    ],
    restrictions: {
      restrict2X: { type: Boolean, default: false },
      onlyUnplaced: { type: Boolean, default: false },
      typeRestriction: { type: String, enum: ["None", "Internship Only", "Full Time Only"], default: "None" },
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: false,
    },
    detailsDocUrl: {
      type: String,
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Job", jobSchema);
