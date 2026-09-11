const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const { createProposal, getProposals, updateProposalStatus, deleteProposal, updateProposal, getAcceptedProposals } = require("../controllers/proposal.controller");

const router = express.Router();

router.post("/", verifyToken, createProposal);
router.get("/", verifyToken, getProposals);
router.get("/accepted", verifyToken, getAcceptedProposals);
router.patch("/:id/status", verifyToken, updateProposalStatus);
router.delete("/:id", verifyToken, deleteProposal);
router.patch("/:id", verifyToken, updateProposal);
router.put("/:id", verifyToken, updateProposal);

module.exports = router;
