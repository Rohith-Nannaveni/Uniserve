const Coupon = require("../models/Coupon");
const createError = require("../utils/createError");

exports.createCoupon = async (req, res, next) => {
  try {
    const { code, discount, isPercentage, expiryDate, targetUsername, minSubscription } = req.body;
    
    if (!code || !discount || !expiryDate) {
      return next(createError(400, "All fields (code, discount, expiryDate) are required!"));
    }

    let targetUserId = null;
    if (req.isAdmin && targetUsername) {
      const User = require("../models/User");
      const targetUser = await User.findOne({ username: targetUsername });
      if (!targetUser) {
        return next(createError(404, `User '${targetUsername}' not found!`));
      }
      targetUserId = targetUser._id;
    }

    // Check if code already exists
    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) {
      return next(createError(400, `The coupon code '${code.toUpperCase()}' already exists!`));
    }

    // Robust date parsing
    const parsedDate = new Date(expiryDate);
    if (isNaN(parsedDate.getTime())) {
      return next(createError(400, "Invalid date format! Please use YYYY-MM-DD."));
    }

    const newCoupon = new Coupon({
      code: code.trim().toUpperCase(),
      discount,
      isPercentage,
      expiryDate: parsedDate,
      vendorId: req.isAdmin ? null : req.userId,
      targetUserId,
      minSubscription: minSubscription || "normal",
      status: req.isAdmin ? "active" : "pending",
      isActive: req.isAdmin ? true : false,
    });

    const savedCoupon = await newCoupon.save();
    res.status(201).send(req.isAdmin ? savedCoupon : { message: "Coupon request submitted to admin.", coupon: savedCoupon });
  } catch (err) {
    if (err.name === "ValidationError") {
      return next(createError(400, Object.values(err.errors).map(e => e.message).join(", ")));
    }
    next(err);
  }
};

exports.deleteCoupon = async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return next(createError(404, "Coupon not found!"));

    // Admin can delete any coupon, Vendor can only delete their own
    if (!req.isAdmin && coupon.vendorId !== req.userId) {
      return next(createError(403, "You are not authorized to delete this coupon!"));
    }

    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).send("Coupon has been deleted.");
  } catch (err) {
    next(err);
  }
};

exports.getVendorCoupons = async (req, res, next) => {
  try {
    // Return ONLY coupons created by this vendor for their own services
    const coupons = await Coupon.find({ vendorId: req.userId });
    res.status(200).send(coupons);
  } catch (err) {
    next(err);
  }
};

exports.getUserCoupons = async (req, res, next) => {
  try {
    const User = require("../models/User");
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    // Return coupons gifted to this user OR global/tier-based coupons
    // A coupon is Global ONLY if targetUserId is null.
    // We also only show Admin-created coupons (vendorId: null) in the "My Coupons" modal
    const coupons = await Coupon.find({
      isActive: true,
      status: "active",
      expiryDate: { $gt: new Date() },
      $or: [
        { targetUserId: req.userId }, // Gifted specifically to me
        { targetUserId: null, vendorId: null } // Global Admin/Tier-based coupons
      ]
    });

    // Filter by tier status: Exact Match for restricted tiers (Task 3 preview)
    const filteredCoupons = coupons.filter(c => {
      if (c.minSubscription === "business") return user.subscription === "business";
      if (c.minSubscription === "premium") return user.subscription === "premium";
      return true; // "normal" or default
    });

    res.status(200).send(filteredCoupons);
  } catch (err) {
    next(err);
  }
};

exports.validateCoupon = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { serviceId } = req.query; 

    const coupon = await Coupon.findOne({ 
        code: code.toUpperCase(),
        status: "active",
        expiryDate: { $gt: new Date() }
    });
    
    if (!coupon) return next(createError(404, "Invalid or expired coupon code!"));

    // Strict User-Specific Check
    if (coupon.targetUserId && coupon.targetUserId.toString() !== req.userId) {
      return next(createError(403, "This coupon is exclusive to another account!"));
    }

    // Strict Tier Restriction
    const User = require("../models/User");
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    if (coupon.minSubscription === "business" && user.subscription !== "business") {
      return next(createError(403, "This coupon requires a BUSINESS subscription!"));
    }
    if (coupon.minSubscription === "premium" && user.subscription !== "premium") {
      return next(createError(403, "This coupon requires a PREMIUM subscription!"));
    }

    // If it's a vendor-specific coupon, check if it belongs to the service's vendor
    if (coupon.vendorId && serviceId) {
      const Service = require("../models/Service");
      const service = await Service.findById(serviceId);
      if (!service || service.userId !== coupon.vendorId) {
        return next(createError(403, "This coupon is not valid for this specific service."));
      }
    }
    
    res.status(200).send(coupon);
  } catch (err) {
    next(err);
  }
};

exports.getPendingCoupons = async (req, res, next) => {
  if (!req.isAdmin) return next(createError(403, "Access denied!"));
  try {
    const coupons = await Coupon.find({ status: "pending" });
    res.status(200).send(coupons);
  } catch (err) {
    next(err);
  }
};

exports.approveCoupon = async (req, res, next) => {
  if (!req.isAdmin) return next(createError(403, "Access denied!"));
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'
    
    const status = action === "approve" ? "active" : "rejected";
    const isActive = action === "approve";

    await Coupon.findByIdAndUpdate(id, { status, isActive });
    res.status(200).send(`Coupon ${action}d successfully.`);
  } catch (err) {
    next(err);
  }
};

exports.getCoupons = async (req, res, next) => {
    if (!req.isAdmin) return next(createError(403, "Only admins can view all coupons!"));
    try {
      const coupons = await Coupon.find();
      res.status(200).send(coupons);
    } catch (err) {
      next(err);
    }
};
