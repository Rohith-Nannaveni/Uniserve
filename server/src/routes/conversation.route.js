const express = require("express");
const {
  createConversation,
  getConversations,
  getSingleConversation,
  updateConversation,
  clearChat,
  deleteEntry,
} = require("../controllers/conversation.controller");
const { verifyToken } = require("../middleware/verifyToken");

const router = express.Router();

router.get("/", verifyToken, getConversations);
router.post("/", verifyToken, createConversation);
router.get("/single/:id", verifyToken, getSingleConversation);
router.put("/:id", verifyToken, updateConversation);
router.put("/clear/:id", verifyToken, clearChat);
router.put("/delete/:id", verifyToken, deleteEntry);

module.exports = router;
