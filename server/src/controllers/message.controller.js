const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const createError = require("../utils/createError");

const createMessage = async (req, res, next) => {
  const newMessage = new Message({
    conversationId: req.body.conversationId,
    userId: req.userId,
    desc: req.body.desc,
  });
  try {
    const savedMessage = await newMessage.save();
    
    // Find the other party in the conversation
    const conversation = await Conversation.findOne({ id: req.body.conversationId });
    if (!conversation) return next(createError(404, "Conversation not found!"));

    const isSenderFirst = req.userId === conversation.sellerId;
    const recipientId = isSenderFirst ? conversation.buyerId : conversation.sellerId;

    // Unhide for both if it was hidden (sending/receiving a message should make it visible)
    await Conversation.findOneAndUpdate(
      { id: req.body.conversationId },
      {
        $set: {
          readBySeller: isSenderFirst,
          readByBuyer: !isSenderFirst,
          lastMessage: req.body.desc,
          hiddenBySeller: false,
          hiddenByBuyer: false,
        },
      },
      { new: true }
    );

    const io = req.app.get("io");
    io.to(recipientId).emit("message", savedMessage);

    res.status(201).send(savedMessage);
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ id: req.params.id });
    if (!conversation) return next(createError(404, "Conversation not found!"));

    const isSeller = req.userId === conversation.sellerId;
    const clearedAt = isSeller ? conversation.clearedAtSeller : conversation.clearedAtBuyer;

    const query = { conversationId: req.params.id };
    if (clearedAt) {
      query.createdAt = { $gt: clearedAt };
    }

    const messages = await Message.find(query);
    res.status(200).send(messages);
  } catch (err) {
    next(err);
  }
};

module.exports = { createMessage, getMessages };
