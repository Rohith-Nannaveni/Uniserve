const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const {
  getOrders,
  getAllOrders,
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
  downloadInvoice,
  createSubscriptionOrder,
  updateOrderStatus,
  cancelOrder,
  deleteOrder,
  rejectRefundDispute,
} = require("../controllers/order.controller");

const router = express.Router();

// Get orders for current user
router.get("/", verifyToken, getOrders);

// Admin: Get all orders
router.get("/all", verifyToken, getAllOrders);

// Razorpay flows
router.post("/create-razorpay-order/:serviceId", verifyToken, createRazorpayOrder);
router.post("/confirm-payment", verifyToken, confirmPayment);

// Status updates
router.patch("/status/:id", verifyToken, updateOrderStatus);
router.patch("/cancel/:id", verifyToken, cancelOrder);

// Manual flows (Cash/QR)
router.post("/create-manual-order/:serviceId", verifyToken, createManualOrder);
router.patch("/complete/:id", verifyToken, markAsCompleted);

// Dispute flows
router.patch("/dispute/:id", verifyToken, raiseDispute);
router.patch("/dispute/respond/:id", verifyToken, respondToDispute);
router.patch("/admin/resolve/:id", verifyToken, adminResolveDispute);

// Refund flows
router.patch("/refund/mark-sent/:id", verifyToken, markRefundAsSent);
router.patch("/refund/confirm/:id", verifyToken, confirmRefundReceived);
router.patch("/refund/dispute/:id", verifyToken, raiseRefundDispute);
router.patch("/admin/reject-refund-dispute/:id", verifyToken, rejectRefundDispute);

// Invoice
router.get("/download/:id", verifyToken, downloadInvoice);
router.post("/create-subscription", verifyToken, createSubscriptionOrder);
router.delete("/:id", verifyToken, deleteOrder);

module.exports = router;
