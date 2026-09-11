const Proposal = require("../models/Proposal");
const User = require("../models/User");
const createError = require("../utils/createError");

const createProposal = async (req, res, next) => {
  try {
    const { hrId, poId, type, proposedDates, targetBranches, expectedBatch, description, initiatedBy, expectedMonth } = req.body;
    
    // Validate roles
    const po = await User.findById(poId);
    const hr = await User.findById(hrId);
    
    if (!po || !hr) return next(createError(404, "User not found!"));
    if (po.role !== "po") return next(createError(403, "PO ID is invalid!"));
    if (hr.role !== "hr") return next(createError(403, "HR ID is invalid!"));

    // Block suspended users from initiating new proposals
    if (initiatedBy === "hr" && hr.reliabilityStatus === "suspended") {
      return next(createError(403, "HR account is suspended. You cannot send new proposals!"));
    }
    if (initiatedBy === "po" && po.reliabilityStatus === "suspended") {
      return next(createError(403, "PO account is suspended. You cannot send new outreach/proposals!"));
    }

    const newProposal = new Proposal({
      poId,
      hrId,
      companyName: hr.hrVerification?.companyName || "Unknown",
      universityName: po.university,
      type,
      proposedDates,
      targetBranches,
      expectedBatch,
      description,
      initiatedBy,
      expectedMonth
    });

    await newProposal.save();
    res.status(201).json(newProposal);
  } catch (err) {
    next(err);
  }
};

const getProposals = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    let query = {};
    if (user.role === "po") query = { poId: req.userId, hiddenByPO: false };
    else if (user.role === "hr") query = { hrId: req.userId, hiddenByHR: false };
    else return next(createError(403, "Unauthorized!"));

    const proposals = await Proposal.find(query)
      .populate("poId", "username university")
      .populate("hrId", "username hrVerification.companyName")
      .sort({ createdAt: -1 });

    res.status(200).json(proposals);
  } catch (err) {
    next(err);
  }
};

const updateProposalStatus = async (req, res, next) => {
  try {
    const { status, declineReason } = req.body;
    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) return next(createError(404, "Proposal not found!"));

    const user = await User.findById(req.userId);
    if (user?.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended. You cannot update proposal status!"));
    }

    // Only the target (recipient) can update the status
    if (proposal.initiatedBy === "po" && req.userId !== proposal.hrId.toString()) {
      return next(createError(403, "Only HR can update this proposal!"));
    }
    if (proposal.initiatedBy === "hr" && req.userId !== proposal.poId.toString()) {
      return next(createError(403, "Only PO can update this proposal!"));
    }

    proposal.status = status;
    if (status === "declined") {
      proposal.declineReason = declineReason;
    } else {
      proposal.declineReason = ""; // Clear decline reason if status changes to accepted or pending
    }
    
    await proposal.save();

    // Create a conversation when accepted
    if (status === "accepted") {
      const Conversation = require("../models/Conversation");
      const conversationId = proposal.poId.toString() + proposal.hrId.toString();
      const existingConv = await Conversation.findOne({ id: conversationId });
      
      if (!existingConv) {
        const newConversation = new Conversation({
          id: conversationId,
          sellerId: proposal.hrId.toString(),
          buyerId: proposal.poId.toString(),
          readBySeller: true,
          readByBuyer: true,
        });
        await newConversation.save();
      }
    }
    
    res.status(200).json(proposal);
  } catch (err) {
    next(err);
  }
};

const deleteProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return next(createError(404, "Proposal not found!"));

    const user = await User.findById(req.userId);
    if (user?.reliabilityStatus === "suspended" && proposal.status === "pending") {
      return next(createError(403, "Your account is suspended. You cannot revoke pending proposals!"));
    }

    // Only the PO or HR involved can delete
    if (req.userId !== proposal.poId.toString() && req.userId !== proposal.hrId.toString()) {
      return next(createError(403, "You can only delete your own proposals!"));
    }

    if (req.userId === proposal.poId.toString()) {
      proposal.hiddenByPO = true;
    } else {
      proposal.hiddenByHR = true;
    }

    // Delete physically if both have hidden it
    if (proposal.hiddenByPO && proposal.hiddenByHR) {
      await Proposal.findByIdAndDelete(req.params.id);
    } else {
      await proposal.save();
    }
    
    res.status(200).send("Proposal hidden/removed.");
  } catch (err) {
    next(err);
  }
};

const updateProposal = async (req, res, next) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return next(createError(404, "Proposal not found!"));

    const user = await User.findById(req.userId);
    if (user?.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended. You cannot update proposals!"));
    }

    // Only the initiator can update before it's accepted/declined
    if (proposal.initiatedBy === "po" && req.userId !== proposal.poId.toString()) {
      return next(createError(403, "You can only update your own proposals!"));
    }
    if (proposal.status !== "pending") {
      return next(createError(400, "Cannot update a non-pending proposal!"));
    }

    const updatedProposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          ...req.body, 
          status: "pending", 
          declineReason: "",
          hiddenByPO: false,
          hiddenByHR: false 
        } 
      },
      { new: true }
    );

    res.status(200).json(updatedProposal);
  } catch (err) {
    next(err);
  }
};

const getAcceptedProposals = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));
    if (user.role !== "hr") return next(createError(403, "Only HRs can view accepted partners!"));

    const proposals = await Proposal.find({ 
      hrId: req.userId, 
      status: "accepted" 
    })
    .populate("poId", "username university")
    .sort({ updatedAt: -1 });

    res.status(200).json(proposals);
  } catch (err) {
    next(err);
  }
};

module.exports = { createProposal, getProposals, updateProposalStatus, deleteProposal, updateProposal, getAcceptedProposals };
