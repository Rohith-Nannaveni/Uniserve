const Service = require("../models/Service");
const User = require("../models/User");
const createError = require("../utils/createError");
const { sendServiceStatusUpdate } = require("../utils/email.util");

const createService = async (req, res, next) => {
  if (!req.isVendor)
    return next(createError(403, "Only vendors can create a service!"));

  try {
    const user = await User.findById(req.userId);
    if (user.isRestricted) {
      return next(createError(403, `Your account is restricted: ${user.restrictionReason}. You cannot add new services until pending refunds are cleared.`));
    }

    const newService = new Service({
      userId: req.userId,
      ...req.body,
      isApproved: false, // Explicitly set to false, requiring admin approval
    });

    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (err) {
    next(err);
  }
};

const approveService = async (req, res, next) => {
  if (!req.isAdmin)
    return next(createError(403, "Only admins can approve services!"));

  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!service) return next(createError(404, "Service not found!"));

    const vendor = await User.findById(service.userId);
    if (vendor) {
        await sendServiceStatusUpdate(vendor.email, service, true);
    }

    res.status(200).send("Service has been approved!");
  } catch (err) {
    next(err);
  }
};

const getPendingServices = async (req, res, next) => {
  if (!req.isAdmin)
    return next(createError(403, "Only admins can see pending services!"));

  try {
    const services = await Service.find({ isApproved: false });
    res.status(200).send(services);
  } catch (err) {
    next(err);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return next(createError(404, "Service not found!"));
    
    if (service.userId.toString() !== req.userId && !req.isAdmin)
      return next(createError(403, "You can delete only your service!"));

    // If admin is deleting an unapproved service, it's a rejection
    if (req.isAdmin && !service.isApproved) {
        const vendor = await User.findById(service.userId);
        if (vendor) {
            await sendServiceStatusUpdate(vendor.email, service, false);
        }
    }

    await Service.findByIdAndDelete(req.params.id);
    res.status(200).send("Service has been deleted!");
  } catch (err) {
    next(err);
  }
};

const getService = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return next(createError(404, "Service not found!"));
    res.status(200).send(service);
  } catch (err) {
    next(err);
  }
};

const getServices = async (req, res, next) => {
  const q = req.query;
  
  try {
    // Find all banned users to exclude their services
    const bannedUsers = await User.find({ isBanned: true }, "_id");
    const bannedUserIds = bannedUsers.map(u => u._id.toString());

    const filters = {
      ...(q.cat && { cat: q.cat }),
      ...((q.min || q.max) && {
        price: {
          ...(q.min && { $gte: Number(q.min) }),
          ...(q.max && { $lte: Number(q.max) }),
        },
      }),
      ...(q.search && { title: { $regex: q.search, $options: "i" } }),
    };

    // Handle userId filtering and banned users exclusion
    if (q.userId) {
      // If not owner/admin, check if user is banned
      if (q.userId !== req.userId && !req.isAdmin && bannedUserIds.includes(q.userId)) {
        return res.status(200).send([]);
      }
      filters.userId = q.userId;
    } else {
      filters.userId = { $nin: bannedUserIds };
    }

    // Default to only approved services unless owner/admin is viewing
    if (req.isAdmin || (q.userId && q.userId === req.userId)) {
      // Admin or owner can see all their services regardless of approval
      if (q.isApproved !== undefined) {
        filters.isApproved = q.isApproved === "true";
      }
    } else {
      // For all others (including guests), only show approved
      filters.isApproved = true;
    }

    const sortField = q.sort || "createdAt";
    const sortOrder = q.sort === "price" ? 1 : -1;
    
    const limit = q.limit ? parseInt(q.limit) : 0;

    const services = await Service.find(filters)
      .sort({ [sortField]: sortOrder })
      .limit(limit);
      
    res.status(200).send(services);
  } catch (err) {
    next(err);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await Service.distinct("cat");
    res.status(200).send(categories);
  } catch (err) {
    next(err);
  }
};

module.exports = { createService, deleteService, getService, getServices, getCategories, approveService, getPendingServices };
