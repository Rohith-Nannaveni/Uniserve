const Review = require("../models/Review");
const Service = require("../models/Service");
const Order = require("../models/Order");
const createError = require("../utils/createError");

exports.createReview = async (req, res, next) => {
  try {
    const service = await Service.findById(req.body.serviceId);
    if (!service) return next(createError(404, "Service not found!"));

    // Prevent vendor from reviewing their own service
    if (service.userId === req.userId) {
      return next(createError(403, "You cannot review your own service!"));
    }

    const review = await Review.findOne({
      orderId: req.body.orderId,
    });

    if (review) return next(createError(403, "You have already created a review for this order!"));

    // Check if user has ordered this specific order and payment is completed
    const order = await Order.findOne({
      _id: req.body.orderId,
      buyerId: req.userId,
      isCompleted: true,
    });

    if (!order) return next(createError(403, "You can only review services from completed orders you have purchased!"));

    const newReview = new Review({
      userId: req.userId,
      serviceId: req.body.serviceId,
      orderId: req.body.orderId,
      desc: req.body.desc,
      star: req.body.star,
    });

    const savedReview = await newReview.save();

    await Service.findByIdAndUpdate(req.body.serviceId, {
      $inc: { totalStars: req.body.star, starNumber: 1 },
    });
    res.status(201).send(savedReview);
  } catch (err) {
    next(err);
  }
};

exports.getReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.serviceId });
    res.status(200).send(reviews);
  } catch (err) {
    next(err);
  }
};

exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(createError(404, "Review not found!"));

    if (review.userId !== req.userId && !req.isAdmin) {
      return next(createError(403, "You can delete only your review!"));
    }

    await Review.findByIdAndDelete(req.params.id);
    
    // Update service rating
    await Service.findByIdAndUpdate(review.serviceId, {
      $inc: { totalStars: -review.star, starNumber: -1 },
    });

    res.status(200).send("Review has been deleted!");
  } catch (err) {
    next(err);
  }
};

exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return next(createError(404, "Review not found!"));

    if (review.userId !== req.userId) {
      return next(createError(403, "You can update only your review!"));
    }

    const oldStar = review.star;
    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          desc: req.body.desc,
          star: req.body.star,
        },
      },
      { new: true }
    );

    // Update service rating difference
    await Service.findByIdAndUpdate(review.serviceId, {
      $inc: { totalStars: req.body.star - oldStar },
    });

    res.status(200).send(updatedReview);
  } catch (err) {
    next(err);
  }
};
