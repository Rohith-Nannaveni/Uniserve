const mongoose = require("mongoose");
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: false,
    },
    link: {
      type: String,
      required: false, // URL to redirect when notification is clicked
    },
    type: {
      type: String,
      enum: ["JOB_SHARE", "OFF_CAMPUS_SHARE", "APPLICATION_STATUS", "PO_RECOMMENDATION", "GENERAL", "ON_CAMPUS_DRIVE", "DRIVE_DATA_REQUEST", "DRIVE_DATA_FULFILLED"],
      default: "JOB_SHARE",
    },
    metadata: {
      type: Object,
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
