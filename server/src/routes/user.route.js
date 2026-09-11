const express = require("express");
const { 
  deleteUser, 
  getUser, 
  updateUser, 
  getUsers, 
  getCurrentUser, 
  upgradeUser, 
  verifySubscriptionPayment,
  getSubscriptionRequests,
  confirmSubscriptionRequest,
  rejectSubscriptionRequest,
  banUser, 
  toggleWishlist, 
  getWishlist, 
  submitAppeal, 
  submitSuspensionAppeal,
  rejectAppeal,
  getUniversities,
  resubmitVerification,
  submitProfileUpdateRequest,
  getProfileUpdateRequests,
  handleProfileUpdateRequest,
  getHRsForStudents,
  getPOAnalytics,
  getPOStudents,
  checkPOExists,
  activateSeller,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  deleteNotification
} = require("../controllers/user.controller");
const { verifyToken, verifyAdmin } = require("../middleware/verifyToken");

const router = express.Router();

router.get("/notifications", verifyToken, getNotifications);
router.patch("/notifications/read-all", verifyToken, markAllNotificationsAsRead);
router.delete("/notifications/clear-all", verifyToken, clearAllNotifications);
router.delete("/notifications/:id", verifyToken, deleteNotification);
router.patch("/notifications/:id", verifyToken, markNotificationAsRead);
router.get("/universities", getUniversities);
router.get("/check-po/:university", checkPOExists);
router.get("/po-analytics", verifyToken, getPOAnalytics);
router.get("/po-students", verifyToken, getPOStudents);
router.post("/activate-seller", verifyToken, activateSeller);
router.get("/hrs", verifyToken, getHRsForStudents);
router.get("/me", verifyToken, getCurrentUser);
router.post("/suspension-appeal", verifyToken, submitSuspensionAppeal);
router.post("/appeal", submitAppeal);
router.post("/resubmit-verification", verifyToken, resubmitVerification);
router.post("/profile-update-request", verifyToken, submitProfileUpdateRequest);
router.get("/profile-update-requests", verifyAdmin, getProfileUpdateRequests);
router.post("/handle-profile-update", verifyAdmin, handleProfileUpdateRequest);
router.get("/wishlist", verifyToken, getWishlist);
router.put("/wishlist/:serviceId", verifyToken, toggleWishlist);
router.get("/", verifyAdmin, getUsers);

// Subscription Routes
router.post("/upgrade", verifyToken, upgradeUser);
router.post("/upgrade/verify", verifyToken, verifySubscriptionPayment);
router.get("/upgrade/requests", verifyAdmin, getSubscriptionRequests);
router.put("/upgrade/confirm/:id", verifyAdmin, confirmSubscriptionRequest);
router.put("/upgrade/reject/:id", verifyAdmin, rejectSubscriptionRequest);

router.delete("/:id", verifyToken, deleteUser);
router.put("/ban/:id", verifyAdmin, banUser);
router.put("/appeal/reject/:id", verifyAdmin, rejectAppeal);
router.get("/:id", getUser);
router.put("/:id", verifyToken, updateUser);

module.exports = router;
