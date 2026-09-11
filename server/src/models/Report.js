const mongoose = require("mongoose");
const { Schema } = mongoose;

const reportSchema = new Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
    },
    category: {
      type: String,
      enum: ["Ghosting after Acceptance", "False Job Details", "Unprofessional Conduct", "Other"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    proofs: {
      type: [String], // Array of Cloudinary URLs
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "under_review", "resolved", "dismissed"],
      default: "pending",
    },
    response: {
      type: String, // Counter-explanation from the reported party
      required: false,
    },
    responseProofs: {
      type: [String],
      default: [],
    },
    adminAction: {
      type: String,
      enum: ["none", "warning", "suspension", "dismissal"],
      default: "none",
    },
    adminNote: {
      type: String,
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", reportSchema);
