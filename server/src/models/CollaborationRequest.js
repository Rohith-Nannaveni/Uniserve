const mongoose = require("mongoose");
const { Schema } = mongoose;

const collaborationRequestSchema = new Schema(
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
    universityName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["campus_drive", "internship", "industrial_visit", "bulk_hiring", "workshop"],
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
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      required: false,
    },
    conversationId: {
      type: String,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CollaborationRequest", collaborationRequestSchema);
