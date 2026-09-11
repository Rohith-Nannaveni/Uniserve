const mongoose = require("mongoose");
const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    sellerId: {
      type: String,
      required: true,
    },
    buyerId: {
      type: String,
      required: true,
    },
    readBySeller: {
      type: Boolean,
      required: true,
    },
    readByBuyer: {
      type: Boolean,
      required: true,
    },
    lastMessage: {
      type: String,
      required: false,
    },
    clearedAtSeller: {
      type: Date,
      default: null,
    },
    clearedAtBuyer: {
      type: Date,
      default: null,
    },
    hiddenBySeller: {
      type: Boolean,
      default: false,
    },
    hiddenByBuyer: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conversation", conversationSchema);
