const mongoose = require("mongoose");
const { Schema } = mongoose;

const collegeSettingsSchema = new Schema(
  {
    poId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    autoApplyMultiplier: {
      type: Boolean,
      default: false,
    },
    globalMultiplierValue: {
      type: Number,
      default: 2.0,
    },
    branchRestrictions: [
      {
        branch: { type: String, required: true },
        allowedRoles: { type: [String], default: [] }
      }
    ],
    // Any other global settings could go here
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CollegeSettings", collegeSettingsSchema);
