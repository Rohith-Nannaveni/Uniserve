const mongoose = require("mongoose");
const { Schema } = mongoose;

const proposalSchema = new Schema(
  {
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hrId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    universityName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["campus_drive", "internship", "workshop", "bulk_hiring"],
      required: true,
    },
    proposedDates: {
      type: [Date],
      required: true,
    },
    targetBranches: {
      type: [String],
      required: true,
    },
    expectedBatch: {
      type: [String],
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    expectedMonth: {
      type: String,
      required: false, // e.g., "March 2026"
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
    },
    declineReason: {
      type: String,
      required: false,
    },
    initiatedBy: {
      type: String,
      enum: ["po", "hr"],
      required: true,
    },
    hiddenByPO: {
      type: Boolean,
      default: false,
    },
    hiddenByHR: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Proposal", proposalSchema);
