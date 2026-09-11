const mongoose = require("mongoose");
const { Schema } = mongoose;

const subscriptionOrderSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ["normal", "premium", "business"],
      required: true,
    },
    university: {
      type: String,
      required: false,
    },
    collegeId: {
      type: String,
      required: false,
    },
    transcripts: {
      type: [String],
      default: [],
    },
    price: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "qr", "cash"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentId: {
      type: String,
      required: false, // Razorpay payment ID or manual transaction reference
    },
    razorpayOrderId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SubscriptionOrder", subscriptionOrderSchema);
