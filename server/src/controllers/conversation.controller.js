const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");
const createError = require("../utils/createError");

const createConversation = async (req, res, next) => {
  const ids = [req.userId, req.body.to].sort();
  const conversationId = ids[0] + ids[1];

  try {
    let conversation = await Conversation.findOne({ id: conversationId });
    if (conversation) {
      // If conversation exists but was hidden, unhide it
      const update = {};
      if (req.userId === conversation.sellerId && conversation.hiddenBySeller) update.hiddenBySeller = false;
      if (req.userId === conversation.buyerId && conversation.hiddenByBuyer) update.hiddenByBuyer = false;
      
      if (Object.keys(update).length > 0) {
        await Conversation.findOneAndUpdate({ id: conversationId }, { $set: update });
      }
      return res.status(200).send(conversation);
    }

    const newConversation = new Conversation({
      id: conversationId,
      sellerId: ids[0],
      buyerId: ids[1],
      readBySeller: req.userId === ids[0],
      readByBuyer: req.userId === ids[1],
    });

    const savedConversation = await newConversation.save();
    res.status(201).send(savedConversation);
  } catch (err) {
    next(err);
  }
};

const updateConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ id: req.params.id });
    if (!conversation) return next(createError(404, "Conversation not found!"));

    const isUserFirst = req.userId === conversation.sellerId;

    const updatedConversation = await Conversation.findOneAndUpdate(
      { id: req.params.id },
      {
        $set: {
          ...(isUserFirst ? { readBySeller: true } : { readByBuyer: true }),
        },
      },
      { new: true }
    );

    res.status(200).send(updatedConversation);
  } catch (err) {
    next(err);
  }
};

const getSingleConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ id: req.params.id });
    if (!conversation) return next(createError(404, "Not found!"));
    
    const otherId = req.userId === conversation.sellerId ? conversation.buyerId : conversation.sellerId;
    const user = await User.findById(otherId);
    
    const result = {
      ...conversation._doc,
      otherUsername: user?.username || "Unknown User",
      otherImg: user?.img || "",
    };

    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find(
      { 
        $or: [
          { sellerId: req.userId, hiddenBySeller: false }, 
          { buyerId: req.userId, hiddenByBuyer: false }
        ] 
      }
    ).sort({ updatedAt: -1 });

    // Fetch Usernames for display
    const result = await Promise.all(conversations.map(async (c) => {
      const otherId = req.userId === c.sellerId ? c.buyerId : c.sellerId;
      const user = await User.findById(otherId);
      return {
        ...c._doc,
        otherUsername: user?.username || "Unknown User",
        otherImg: user?.img || "",
      };
    }));

    res.status(200).send(result);
  } catch (err) {
    next(err);
  }
};

const clearChat = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ id: req.params.id });
    if (!conversation) return next(createError(404, "Conversation not found!"));

    const isSeller = req.userId === conversation.sellerId;
    const update = isSeller ? { clearedAtSeller: new Date() } : { clearedAtBuyer: new Date() };

    await Conversation.findOneAndUpdate({ id: req.params.id }, { $set: update });

    // Check for permanent deletion
    const updatedConv = await Conversation.findOne({ id: req.params.id });
    if (updatedConv.clearedAtSeller && updatedConv.clearedAtBuyer && 
        (updatedConv.hiddenBySeller || updatedConv.clearedAtSeller) && 
        (updatedConv.hiddenByBuyer || updatedConv.clearedAtBuyer)) {
      // Permanent deletion only if both have cleared
      // Actually, as per requirement: "Only if both A and B clears the chat remove that data from database permanently"
      // We can also check if they are hidden.
      
      // If both sides have cleared (or one hidden and one cleared)
      // For simplicity, if both have a 'clearedAt' or 'hiddenBy' timestamp/flag
      if ((updatedConv.clearedAtSeller || updatedConv.hiddenBySeller) && 
          (updatedConv.clearedAtBuyer || updatedConv.hiddenByBuyer)) {
        await Message.deleteMany({ conversationId: req.params.id });
        // Optionally delete the conversation too if both have it hidden
        if (updatedConv.hiddenBySeller && updatedConv.hiddenByBuyer) {
            await Conversation.findOneAndDelete({ id: req.params.id });
        }
      }
    }

    res.status(200).send("Chat has been cleared!");
  } catch (err) {
    next(err);
  }
};

const deleteEntry = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({ id: req.params.id });
    if (!conversation) return next(createError(404, "Conversation not found!"));

    const isSeller = req.userId === conversation.sellerId;
    const update = isSeller 
      ? { hiddenBySeller: true, clearedAtSeller: new Date() } 
      : { hiddenByBuyer: true, clearedAtBuyer: new Date() };

    await Conversation.findOneAndUpdate({ id: req.params.id }, { $set: update });

    // Check for permanent deletion logic (same as clearChat)
    const updatedConv = await Conversation.findOne({ id: req.params.id });
    if ((updatedConv.hiddenBySeller || updatedConv.clearedAtSeller) && 
        (updatedConv.hiddenByBuyer || updatedConv.clearedAtBuyer)) {
      
      // If both hidden, we can delete the whole conversation and messages
      if (updatedConv.hiddenBySeller && updatedConv.hiddenByBuyer) {
        await Message.deleteMany({ conversationId: req.params.id });
        await Conversation.findOneAndDelete({ id: req.params.id });
      } else {
        // If one side cleared/hidden, we already filtered in getMessages (to be implemented in Task 3)
        // But if both have performed some "deletion" action, we can purge messages.
        // Actually, let's keep it safe: only purge if both have cleared OR hidden.
        await Message.deleteMany({ conversationId: req.params.id });
      }
    }

    res.status(200).send("Entry has been deleted!");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createConversation,
  getConversations,
  getSingleConversation,
  updateConversation,
  clearChat,
  deleteEntry,
};
