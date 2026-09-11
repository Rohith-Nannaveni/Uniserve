const mongoose = require("mongoose");
const { Schema } = mongoose;

const orderSchema = new Schema(
  {
    serviceId: {
      type: String,
      required: true,
    },
    img: {
      type: String,
      required: false,
    },
    cat: {
      type: String,
      required: false,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    vendorId: {
      type: String,
      required: true,
    },
    buyerId: {
      type: String,
      required: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    payment_intent: {
      type: String,
      required: false, // Required for Razorpay, not for Cash/QR initially
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cash", "qr"],
      default: "razorpay",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "disputed", "refunded", "partially_refunded"],
      default: "pending",
    },
    dispute: {
      raisedBy: { type: String }, // 'buyer' or 'vendor'
      reason: { type: String },
      proofs: { type: [String] },
      response: { type: String },
      responseProofs: { type: [String] },
      status: { type: String, enum: ["open", "responded", "resolved"], default: "open" },
      refundPercentage: { type: Number, default: 0 },
      refundAmount: { type: Number, default: 0 },
      refundStatus: { 
        type: String, 
        enum: ["none", "pending_vendor", "awaiting_buyer", "completed", "refund_disputed"], 
        default: "none" 
      },
      refundProof: { type: String },
      refundDisputeReason: { type: String },
      refundDisputeProof: { type: String }
    },
    disputeReason: {
      type: String,
      required: false,
    },
    disputeProofs: {
      type: [String], // Array of URLs to proof images
      required: false,
    },
    couponCode: {
      type: String,
      required: false,
    },
    discount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "delivered", "completed", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
