const mongoose = require("mongoose");
const { Schema } = mongoose;

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    discount: {
      type: Number,
      required: true, // Percentage or fixed amount? Let's go with percentage
    },
    isPercentage: {
        type: Boolean,
        default: true
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    vendorId: {
      type: String,
      required: false, // If null, it's a global coupon
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // If null, it's global or tier-based
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "active", // Global ones created by admin are active by default
    },
    minSubscription: {
      type: String,
      enum: ["normal", "premium", "business"],
      default: "normal",
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coupon", couponSchema);
