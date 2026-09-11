const Order = require("../models/Order");
const Service = require("../models/Service");
const User = require("../models/User");
const Coupon = require("../models/Coupon");
const createError = require("../utils/createError");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const { sendOrderNotification, sendOrderStatusUpdate, sendOrderCancelNotification, sendEmail, sendDisputeNotification, sendDisputeResponseNotification } = require("../utils/email.util");

// Initialize Razorpay
// Note: These should ideally be in .env. We'll use placeholders that the user can fill.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

const createRazorpayOrder = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.serviceId);
    if (!service) return next(createError(404, "Service not found!"));

    if (service.userId === req.userId) {
      return next(createError(403, "You cannot book your own service!"));
    }

    // Check if vendor is restricted
    const vendor = await User.findById(service.userId);
    if (vendor && vendor.isRestricted) {
      return next(createError(403, "This vendor is currently restricted due to pending refunds and cannot accept new orders."));
    }

    const { couponCode } = req.body;
    let finalPrice = service.price;
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gt: new Date() },
      });
      if (coupon) {
        // Tier Restriction Check
        const buyer = await User.findById(req.userId);
        
        // Strict User-Specific Check
        if (coupon.targetUserId && coupon.targetUserId.toString() !== req.userId) {
          return next(createError(403, "This coupon is exclusive to another account!"));
        }

        if (coupon.minSubscription === "business" && buyer.subscription !== "business") {
          return next(createError(403, "This coupon requires a BUSINESS subscription!"));
        }
        if (coupon.minSubscription === "premium" && buyer.subscription !== "premium") {
          return next(createError(403, "This coupon requires a PREMIUM subscription!"));
        }

        if (coupon.isPercentage) {
          discountAmount = (service.price * coupon.discount) / 100;
        } else {
          discountAmount = coupon.discount;
        }
        finalPrice = Math.max(0, service.price - discountAmount);
      }
    }

    const options = {
      amount: Math.round(finalPrice * 100), // Razorpay works in paisa
      currency: "INR",
      receipt: "receipt_" + Math.random().toString(36).substring(7),
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const newOrder = new Order({
      serviceId: service._id,
      img: service.cover,
      cat: service.cat,
      title: service.title,
      buyerId: req.userId,
      vendorId: service.userId,
      price: finalPrice,
      couponCode: couponCode ? couponCode.toUpperCase() : null,
      discount: discountAmount,
      payment_intent: razorpayOrder.id,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
    });

    await newOrder.save();
    res.status(200).json(razorpayOrder);
  } catch (err) {
    next(err);
  }
};

const confirmPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const order = await Order.findOneAndUpdate(
        { payment_intent: razorpay_order_id },
        {
          $set: {
            paymentStatus: "completed",
            isCompleted: true,
            status: "completed",
          },
        },
        { new: true }
      );
      
      // Update service sales
      await Service.findByIdAndUpdate(order.serviceId, {
        $inc: { sales: 1 },
      });

      // Send Email Notifications
      const buyer = await User.findById(order.buyerId);
      const vendor = await User.findById(order.vendorId);
      
      if (buyer) await sendOrderNotification(buyer.email, order, false);
      if (vendor) await sendOrderNotification(vendor.email, order, true);

      res.status(200).send("Payment verified successfully.");
    } else {
      res.status(400).send("Invalid signature sent!");
    }
  } catch (err) {
    next(err);
  }
};

const createManualOrder = async (req, res, next) => {
  try {
    const service = await Service.findById(req.params.serviceId);
    if (!service) return next(createError(404, "Service not found!"));

    if (service.userId === req.userId) {
      return next(createError(403, "You cannot book your own service!"));
    }

    // Check if vendor is restricted
    const vendor = await User.findById(service.userId);
    if (vendor && vendor.isRestricted) {
      return next(createError(403, "This vendor is currently restricted due to pending refunds and cannot accept new orders."));
    }

    const { paymentMethod, couponCode } = req.body;
    let finalPrice = service.price;
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expiryDate: { $gt: new Date() },
      });
      if (coupon) {
        // Tier Restriction Check
        const buyer = await User.findById(req.userId);
        
        // Strict User-Specific Check
        if (coupon.targetUserId && coupon.targetUserId.toString() !== req.userId) {
          return next(createError(403, "This coupon is exclusive to another account!"));
        }

        if (coupon.minSubscription === "business" && buyer.subscription !== "business") {
          return next(createError(403, "This coupon requires a BUSINESS subscription!"));
        }
        if (coupon.minSubscription === "premium" && buyer.subscription !== "premium") {
          return next(createError(403, "This coupon requires a PREMIUM subscription!"));
        }

        if (coupon.isPercentage) {
          discountAmount = (service.price * coupon.discount) / 100;
        } else {
          discountAmount = coupon.discount;
        }
        finalPrice = Math.max(0, service.price - discountAmount);
      }
    }

    const newOrder = new Order({
      serviceId: service._id,
      img: service.cover,
      cat: service.cat,
      title: service.title,
      buyerId: req.userId,
      vendorId: service.userId,
      price: finalPrice,
      couponCode: couponCode ? couponCode.toUpperCase() : null,
      discount: discountAmount,
      paymentMethod: paymentMethod, // 'cash' or 'qr'
      paymentStatus: "pending",
      isCompleted: false,
    });

    await newOrder.save();

    // Send Email Notifications
    const buyer = await User.findById(req.userId);
    
    if (buyer) await sendOrderNotification(buyer.email, { ...newOrder._doc, deliveryTime: service.deliveryTime }, false);
    if (vendor) await sendOrderNotification(vendor.email, { ...newOrder._doc, deliveryTime: service.deliveryTime }, true);

    res.status(200).send("Order initiated. Awaiting provider confirmation.");
  } catch (err) {
    next(err);
  }
};

const markAsCompleted = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    // IMPORTANT: Once cancelled or completed, status cannot be changed
    if (order.status === "cancelled") {
      return next(createError(400, "This order has been cancelled and cannot be modified!"));
    }
    if (order.status === "completed") {
      return next(createError(400, "This order is already marked as completed!"));
    }

    // Only provider can mark as completed for manual payments
    if (order.vendorId !== req.userId && !req.isAdmin) {
      return next(createError(403, "Only the service provider can confirm manual payments!"));
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          paymentStatus: "completed",
          isCompleted: true,
          status: "completed",
        },
      },
      { new: true }
    );

    // Update service sales
    await Service.findByIdAndUpdate(order.serviceId, {
      $inc: { sales: 1 },
    });

    // Send Email Notifications for manual payment confirmation
    const buyer = await User.findById(order.buyerId);
    const vendor = await User.findById(order.vendorId);
    
    if (buyer) await sendOrderNotification(buyer.email, updatedOrder, false);
    if (vendor) await sendOrderNotification(vendor.email, updatedOrder, true);

    res.status(200).send("Order marked as completed.");
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    // IMPORTANT: Once cancelled or completed, status cannot be changed
    if (order.status === "cancelled") {
      return next(createError(400, "This order has been cancelled and cannot be modified!"));
    }
    if (order.status === "completed") {
      return next(createError(400, "Completed orders cannot be modified!"));
    }

    // Only the vendor or admin can update status
    if (order.vendorId.toString() !== req.userId && !req.isAdmin) {
      return next(createError(403, "Only the vendor can update the status!"));
    }

    const updateFields = { status };
    if (status === "completed") {
      updateFields.isCompleted = true;
      updateFields.paymentStatus = "completed";
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    );

    // Send Status Update Email to Buyer
    const buyer = await User.findById(order.buyerId);
    const vendor = await User.findById(order.vendorId);

    if (status === "cancelled") {
      // If vendor cancels, send cancellation emails
      if (buyer) await sendOrderCancelNotification(buyer.email, updatedOrder, false);
      if (vendor) await sendOrderCancelNotification(vendor.email, updatedOrder, false);
    } else if (buyer) {
      await sendOrderStatusUpdate(buyer.email, updatedOrder, status);
    }

    // Increment sales ONLY if it wasn't completed before
    if (status === "completed" && !order.isCompleted) {
      await Service.findByIdAndUpdate(order.serviceId, {
        $inc: { sales: 1 },
      });
    }

    res.status(200).send("Order status updated.");
  } catch (err) {
    next(err);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    // Check if user is the buyer
    if (order.buyerId.toString() !== req.userId) {
      return next(createError(403, "You can only cancel your own orders!"));
    }

    // Check if status is pending
    if (order.status !== "pending") {
      return next(createError(400, "Only pending orders can be cancelled!"));
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "cancelled",
        },
      },
      { new: true }
    );

    // Send Cancellation Emails
    const buyer = await User.findById(order.buyerId);
    const vendor = await User.findById(order.vendorId);
    
    if (buyer) await sendOrderCancelNotification(buyer.email, updatedOrder, true);
    if (vendor) await sendOrderCancelNotification(vendor.email, updatedOrder, true);

    res.status(200).send("Order cancelled successfully.");
  } catch (err) {
    next(err);
  }
};

const raiseDispute = async (req, res, next) => {
  try {
    const { reason, proofs } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    const isBuyer = order.buyerId.toString() === req.userId;
    const isVendor = order.vendorId.toString() === req.userId;

    if (!isBuyer && !isVendor) {
      return next(createError(403, "You can only raise disputes for your own orders!"));
    }

    // Only allow disputes for in_progress, delivered, or completed orders
    const allowedStatuses = ["in_progress", "delivered", "completed"];
    if (!allowedStatuses.includes(order.status)) {
        return next(createError(400, "Disputes can only be raised for orders that are in progress, delivered, or completed."));
    }

    const raisedBy = isBuyer ? "buyer" : "vendor";

    await Order.findByIdAndUpdate(req.params.id, {
      $set: {
        paymentStatus: "disputed",
        dispute: {
          raisedBy,
          reason,
          proofs,
          status: "open",
        },
      },
    });

    // Notify the other party
    const recipientId = isBuyer ? order.vendorId : order.buyerId;
    const recipient = await User.findById(recipientId);
    if (recipient) {
      await sendDisputeNotification(recipient.email, order, reason, isBuyer);
    }

    res.status(200).send("Dispute raised. The other party has been notified and an Admin will review your request.");
  } catch (err) {
    next(err);
  }
};

const respondToDispute = async (req, res, next) => {
  try {
    const { response, proofs } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    if (order.paymentStatus !== "disputed") {
      return next(createError(400, "This order is not under dispute!"));
    }

    const isBuyer = order.buyerId.toString() === req.userId;
    const isVendor = order.vendorId.toString() === req.userId;

    if (!isBuyer && !isVendor) {
      return next(createError(403, "Access denied!"));
    }

    // Ensure the responder is NOT the one who raised it
    if ((order.dispute.raisedBy === "buyer" && isBuyer) || (order.dispute.raisedBy === "vendor" && isVendor)) {
      return next(createError(400, "You cannot respond to your own dispute! Wait for the other party or Admin."));
    }

    await Order.findByIdAndUpdate(req.params.id, {
      $set: {
        "dispute.response": response,
        "dispute.responseProofs": proofs,
        "dispute.status": "responded",
      },
    });

    // Notify the party who raised the dispute
    const raiserId = order.dispute.raisedBy === "buyer" ? order.buyerId : order.vendorId;
    const raiser = await User.findById(raiserId);
    if (raiser) {
      await sendDisputeResponseNotification(raiser.email, order, response);
    }

    res.status(200).send("Response submitted successfully. Admin will now review both claims.");
  } catch (err) {
    next(err);
  }
};

const adminResolveDispute = async (req, res, next) => {
  console.log("Admin resolving dispute for order:", req.params.id);
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can resolve disputes!"));

    const { status, refundPercentage } = req.body; 
    console.log("Resolution data:", { status, refundPercentage });
    
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) return next(createError(404, "Order not found!"));

    const percent = Number(refundPercentage) || 0;
    const refundAmount = Math.round((order.price * percent) / 100);
    console.log("Calculated refund:", refundAmount);

    const updateData = {
      "dispute.status": "resolved",
      "dispute.refundPercentage": percent,
      "dispute.refundAmount": refundAmount,
    };

    if (percent === 0) {
      console.log("Ruling for Seller (0% refund)");
      updateData.paymentStatus = "completed";
      updateData.isCompleted = true;
      updateData.status = "completed";
      updateData["dispute.refundStatus"] = "none";
    } else {
      console.log(`Ruling for Buyer (${percent}% refund)`);
      if (order.paymentMethod === "razorpay") {
        console.log("Processing Razorpay refund...");
        try {
          // Automated Razorpay Refund
          await razorpay.payments.refund(order.payment_intent, {
            amount: refundAmount * 100, // paisa
            notes: { reason: "Admin Dispute Resolution", orderId: order._id.toString() }
          });
          updateData.paymentStatus = percent === 100 ? "refunded" : "partially_refunded";
          updateData["dispute.refundStatus"] = "completed";
          updateData.status = "cancelled";
        } catch (razorError) {
          console.error("Razorpay Refund Error details:", razorError);
          return next(createError(500, "Failed to initiate Razorpay refund automatically."));
        }
      } else {
        console.log("Processing Manual refund (Cash/QR)...");
        updateData.paymentStatus = "disputed"; 
        updateData["dispute.refundStatus"] = "pending_vendor";
        
        console.log("Restricting vendor:", order.vendorId);
        await User.findByIdAndUpdate(order.vendorId, {
          $set: { isRestricted: true, restrictionReason: `Pending refund for Order #${order._id}` },
          $addToSet: { restrictedOrders: order._id }
        });
      }
    }

    console.log("Updating order document...");
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { $set: updateData }, { new: true });

    if (percent === 0 && !order.isCompleted) {
       await Service.findByIdAndUpdate(order.serviceId, {
        $inc: { sales: 1 },
      });
    }

    console.log("Resolution complete.");
    res.status(200).send(`Dispute resolved with ${percent}% refund.`);
  } catch (err) {
    console.error("Critical error in adminResolveDispute:", err);
    next(err);
  }
};

const markRefundAsSent = async (req, res, next) => {
  try {
    const { refundProof } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    if (order.vendorId !== req.userId) return next(createError(403, "Access denied!"));
    if (order.dispute.refundStatus !== "pending_vendor") return next(createError(400, "Refund is not pending or already sent."));

    await Order.findByIdAndUpdate(req.params.id, {
      $set: {
        "dispute.refundStatus": "awaiting_buyer",
        "dispute.refundProof": refundProof,
      }
    });

    res.status(200).send("Refund marked as sent. Waiting for buyer confirmation.");
  } catch (err) {
    next(err);
  }
};

const confirmRefundReceived = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    if (order.buyerId !== req.userId && !req.isAdmin) return next(createError(403, "Access denied!"));

    const refundPercent = order.dispute.refundPercentage;
    
    await Order.findByIdAndUpdate(req.params.id, {
      $set: {
        "dispute.refundStatus": "completed",
        paymentStatus: refundPercent === 100 ? "refunded" : "partially_refunded",
        status: "cancelled",
      }
    });

    // Lift Vendor Restriction
    const vendor = await User.findById(order.vendorId);
    if (vendor) {
      const restrictedList = vendor.restrictedOrders || [];
      const remainingRestricted = restrictedList.filter(id => id.toString() !== order._id.toString());
      await User.findByIdAndUpdate(order.vendorId, {
        $set: { 
          restrictedOrders: remainingRestricted,
          isRestricted: remainingRestricted.length > 0 
        }
      });
    }

    res.status(200).send("Refund confirmed and restriction lifted.");
  } catch (err) {
    next(err);
  }
};

const raiseRefundDispute = async (req, res, next) => {
  try {
    const { reason, proof } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    if (order.vendorId !== req.userId) return next(createError(403, "Access denied!"));

    await Order.findByIdAndUpdate(req.params.id, {
      $set: {
        "dispute.refundStatus": "refund_disputed",
        "dispute.refundDisputeReason": reason,
        "dispute.refundDisputeProof": proof,
      }
    });

    res.status(200).send("Refund dispute raised. Admin will verify your payment proof.");
  } catch (err) {
    next(err);
  }
};

const rejectRefundDispute = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can perform this action!"));
    
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    await Order.findByIdAndUpdate(req.params.id, {
      $set: {
        "dispute.refundStatus": "pending_vendor",
      }
    });

    res.status(200).send("Refund dispute rejected. Vendor must provide valid proof.");
  } catch (err) {
    next(err);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      $or: [{ vendorId: req.userId }, { buyerId: req.userId }],
    });

    res.status(200).send(orders);
  } catch (err) {
    next(err);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Access denied!"));
    const orders = await Order.find();
    res.status(200).send(orders);
  } catch (err) {
    next(err);
  }
};

const downloadInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    const buyer = await User.findById(order.buyerId);
    const vendor = await User.findById(order.vendorId);

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice_${order._id}.pdf`);

    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(25).text("UniServe Invoice", { align: "center" });
    doc.moveDown();
    
    doc.fontSize(14).text("Order Summary", { underline: true });
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${order.createdAt.toDateString()}`);
    doc.text(`Status: ${order.paymentStatus.toUpperCase()}`);
    doc.moveDown();

    doc.fontSize(14).text("Service Details", { underline: true });
    doc.fontSize(12).text(`Title: ${order.title}`);
    doc.text(`Price: ₹${order.price}`);
    doc.text(`Payment Method: ${order.paymentMethod.toUpperCase()}`);
    doc.moveDown();

    doc.fontSize(14).text("Buyer Details", { underline: true });
    doc.fontSize(12).text(`Name: ${buyer?.username || "N/A"}`);
    doc.text(`Email: ${buyer?.email || "N/A"}`);
    doc.text(`Phone: ${buyer?.phone || "N/A"}`);
    doc.moveDown();

    doc.fontSize(14).text("Seller Details", { underline: true });
    doc.fontSize(12).text(`Name: ${vendor?.username || "N/A"}`);
    doc.text(`Email: ${vendor?.email || "N/A"}`);
    doc.text(`Phone: ${vendor?.phone || "N/A"}`);
    doc.moveDown();

    doc.text("--------------------------------------------------", { align: "center" });
    doc.moveDown();
    doc.text("Thank you for using UniServe!", { align: "center" });

    doc.end();
  } catch (err) {
    next(err);
  }
};

const createSubscriptionOrder = async (req, res, next) => {
  try {
    const { plan, amount } = req.body;
    
    const options = {
      amount: amount * 100, // Amount in paisa
      currency: "INR",
      receipt: "sub_" + Math.random().toString(36).substring(7),
    };

    const razorpayOrder = await razorpay.orders.create(options);
    res.status(200).json(razorpayOrder);
  } catch (err) {
    next(err);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return next(createError(404, "Order not found!"));

    // Allow deletion if admin or if the user is part of the order
    if (
      !req.isAdmin &&
      order.buyerId.toString() !== req.userId &&
      order.vendorId.toString() !== req.userId
    ) {
      return next(createError(403, "You can only delete your own order records!"));
    }

    // Only allow deletion of completed or cancelled orders for regular users
    if (!req.isAdmin && order.status !== "completed" && order.status !== "cancelled") {
        return next(createError(400, "Only completed or cancelled orders can be deleted from your view."));
    }

    await Order.findByIdAndDelete(req.params.id);
    res.status(200).send("Order record deleted successfully.");
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createRazorpayOrder,
  confirmPayment,
  createManualOrder,
  markAsCompleted,
  raiseDispute,
  respondToDispute,
  adminResolveDispute,
  markRefundAsSent,
  confirmRefundReceived,
  raiseRefundDispute,
  getOrders,
  getAllOrders,
  downloadInvoice,
  createSubscriptionOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  rejectRefundDispute,
};
