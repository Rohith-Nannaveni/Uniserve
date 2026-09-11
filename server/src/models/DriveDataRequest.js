const mongoose = require("mongoose");
const { Schema } = mongoose;

const DriveDataRequestSchema = new Schema({
  jobId: {
    type: Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  poId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  hrId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  requestedStage: {
    type: String,
    enum: ["Applied", "Shortlisted", "Interview", "Hired"],
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "fulfilled", "declined"],
    default: "pending",
  },
  university: {
    type: String,
    required: true,
  },
  isProactive: {
    type: Boolean,
    default: false,
  },
  fulfilledAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("DriveDataRequest", DriveDataRequestSchema);
