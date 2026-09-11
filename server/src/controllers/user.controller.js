const User = require("../models/User");
const Service = require("../models/Service");
const SubscriptionOrder = require("../models/SubscriptionOrder");
const Notification = require("../models/Notification");
const createError = require("../utils/createError");
const bcrypt = require("bcryptjs");
const Razorpay = require("razorpay");
const crypto = require("crypto");

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, "User not found!"));

    if (req.userId !== user._id.toString() && !req.isAdmin) {
      return next(createError(403, "You can delete only your account!"));
    }
    await User.findByIdAndDelete(req.params.id);
    
    // Also delete any services created by this user
    await Service.deleteMany({ userId: req.params.id });

    res.status(200).send("User and associated services deleted.");
  } catch (err) {
    next(err);
  }
};

const getUsers = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can see all users!"));
    const users = await User.find();
    res.status(200).send(users);
  } catch (err) {
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, "User not found!"));
    const { password, ...info } = user._doc;
    res.status(200).send(info);
  } catch (err) {
    next(err);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    // Check for subscription expiry
    if (user.subscription !== "normal" && user.subscriptionExpiry && new Date() > user.subscriptionExpiry) {
      user.subscription = "normal";
      user.trustBadge = "none";
      user.subscriptionExpiry = null;
      await user.save();
    }

    const { password, ...info } = user._doc;
    res.status(200).send(info);
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return next(createError(403, "You can update only your account!"));
    }

    const user = await User.findById(req.userId);
    if (user?.reliabilityStatus === "suspended" && !req.isAdmin) {
      // Allow only appeal related updates? No, appeal has its own endpoint.
      // We should block profile updates for suspended institutional users.
      if (user.role === "po" || user.role === "hr") {
        return next(createError(403, "Your account is suspended. You cannot update your profile!"));
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    const { password, ...info } = updatedUser._doc;
    res.status(200).send(info);
  } catch (err) {
    next(err);
  }
};

const submitSuspensionAppeal = async (req, res, next) => {
  try {
    const { appealReason, appealDocuments } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    if (user.reliabilityStatus !== "suspended" && user.reliabilityStatus !== "low") {
      return next(createError(400, "Only users with suspended or low trust status can submit appeals!"));
    }

    user.appealReason = appealReason;
    user.appealDocuments = appealDocuments || [];
    user.appealStatus = "pending";
    
    await user.save();
    res.status(200).send("Appeal submitted successfully.");
  } catch (err) {
    next(err);
  }
};

const upgradeUser = async (req, res, next) => {
  try {
    const { plan, paymentMethod, paymentId, university, collegeId, transcripts } = req.body;
    
    // Simple price mapping (these can be adjusted)
    const prices = {
      premium: 499,
      business: 999
    };

    if (!prices[plan]) return next(createError(400, "Invalid plan selected!"));

    if (!university || university.trim() === "") {
      return next(createError(400, "University name is required for subscription!"));
    }

    const price = prices[plan];

    if (paymentMethod === "razorpay") {
      const options = {
        amount: price * 100, // paisa
        currency: "INR",
        receipt: "sub_receipt_" + Math.random().toString(36).substring(7),
      };

      const razorpayOrder = await razorpay.orders.create(options);

      const newSubOrder = new SubscriptionOrder({
        userId: req.userId,
        plan,
        price,
        paymentMethod: "razorpay",
        razorpayOrderId: razorpayOrder.id,
        paymentStatus: "pending",
        university,
        collegeId,
        transcripts: transcripts || [],
      });

      await newSubOrder.save();
      return res.status(200).json(razorpayOrder);
    }

    // Manual payments (QR or Cash)
    const newSubOrder = new SubscriptionOrder({
      userId: req.userId,
      plan,
      price,
      paymentMethod,
      paymentId: paymentId || "pending_verification",
      paymentStatus: "pending",
      university,
      collegeId,
      transcripts: transcripts || [],
    });

    await newSubOrder.save();

    // Update user's pending verification status so Admin can see it in the verification hub
    await User.findByIdAndUpdate(req.userId, {
      $set: {
        // Safely set university only when provided — avoids silently skipping with `|| undefined`
        ...(university ? { university } : {}),
        "studentVerification.collegeId": collegeId,
        "studentVerification.transcripts": transcripts || [],
        "studentVerification.status": "pending",
        "studentVerification.rejectionReason": "",
      }
    });

    res.status(200).send("Subscription request submitted. Admin will verify and activate your plan.");
  } catch (err) {
    next(err);
  }
};

const verifySubscriptionPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "placeholder_secret")
      .update(sign.toString())
      .digest("hex");

      if (razorpay_signature === expectedSign) {
        const subOrder = await SubscriptionOrder.findOneAndUpdate(
          { razorpayOrderId: razorpay_order_id },
          {
            $set: {
              paymentStatus: "paid",
              paymentId: razorpay_payment_id,
            },
          },
          { new: true }
        );

        if (!subOrder) return next(createError(404, "Subscription order not found!"));

        let badge = "none";
        if (subOrder.plan === "premium") badge = "premium";
        if (subOrder.plan === "business") badge = "expert";

        // 30 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        await User.findByIdAndUpdate(subOrder.userId, {
          $set: {
            subscription: subOrder.plan,
            trustBadge: badge,
            subscriptionExpiry: expiryDate,
            // Safely set university only when provided, so PO can always find the student
            ...(subOrder.university ? { university: subOrder.university } : {}),
            studentVerification: {
              collegeId: subOrder.collegeId,
              transcripts: subOrder.transcripts,
              status: "approved", 
            },
          },
        });

      res.status(200).send("Subscription activated successfully!");
    } else {
      res.status(400).send("Invalid payment signature!");
    }
  } catch (err) {
    next(err);
  }
};

const getSubscriptionRequests = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can see requests!"));
    const requests = await SubscriptionOrder.find({ paymentStatus: "pending" });
    res.status(200).send(requests);
  } catch (err) {
    next(err);
  }
};

const confirmSubscriptionRequest = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can confirm requests!"));
    
    const subOrder = await SubscriptionOrder.findById(req.params.id);
    if (!subOrder) return next(createError(404, "Request not found!"));

    subOrder.paymentStatus = "paid";
    await subOrder.save();

    let badge = "none";
    if (subOrder.plan === "premium") badge = "premium";
    if (subOrder.plan === "business") badge = "expert";

    // 30 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    await User.findByIdAndUpdate(subOrder.userId, {
      $set: {
        subscription: subOrder.plan,
        trustBadge: badge,
        subscriptionExpiry: expiryDate,
        "studentVerification.status": "approved", // Payment confirmed means proof is also valid
        // Ensure university is always propagated so PO can find the student
        ...(subOrder.university ? { university: subOrder.university } : {}),
      },
    });

    res.status(200).send("Subscription activated successfully!");
  } catch (err) {
    next(err);
  }
};

const rejectSubscriptionRequest = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can reject requests!"));
    
    const subOrder = await SubscriptionOrder.findById(req.params.id);
    if (!subOrder) return next(createError(404, "Request not found!"));

    subOrder.paymentStatus = "failed";
    await subOrder.save();

    await User.findByIdAndUpdate(subOrder.userId, {
      $set: {
        "studentVerification.status": "rejected",
        "studentVerification.rejectionReason": req.body.reason || "Payment not verified",
      },
    });

    res.status(200).send("Subscription request rejected.");
  } catch (err) {
    next(err);
  }
};

const banUser = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can ban users!"));
    
    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, "User not found!"));

    user.isBanned = !user.isBanned; // Toggle ban status
    if (!user.isBanned) {
      user.appealStatus = "resolved";
    }
    await user.save();

    res.status(200).send(`User has been ${user.isBanned ? "banned" : "unbanned"}!`);
  } catch (err) {
    next(err);
  }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    const serviceId = req.params.serviceId;

    if (user.wishlist.includes(serviceId)) {
      user.wishlist = user.wishlist.filter((id) => id.toString() !== serviceId);
    } else {
      user.wishlist.push(serviceId);
    }

    await user.save();
    res.status(200).send(user.wishlist);
  } catch (err) {
    next(err);
  }
};

const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate("wishlist");
    res.status(200).send(user.wishlist);
  } catch (err) {
    next(err);
  }
};

const submitAppeal = async (req, res, next) => {
  try {
    const { email, password, reason, documents } = req.body;
    const user = await User.findOne({ email });

    if (!user) return next(createError(404, "User not found!"));
    
    // Only check password if user didn't register with Google
    if (!user.googleId) {
      if (!password) return next(createError(400, "Password is required for verification!"));
      const isCorrect = bcrypt.compareSync(password, user.password);
      if (!isCorrect) return next(createError(400, "Invalid credentials!"));
    }

    if (!user.isBanned) return next(createError(400, "Your account is not banned!"));

    user.appealReason = reason;
    user.appealDocuments = documents;
    user.appealStatus = "pending";
    await user.save();

    res.status(200).send("Your appeal has been submitted and is pending review.");
  } catch (err) {
    next(err);
  }
};

const rejectAppeal = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can reject appeals!"));
    
    const user = await User.findById(req.params.id);
    if (!user) return next(createError(404, "User not found!"));

    user.appealStatus = "resolved"; // Mark as handled but keep banned
    await user.save();

    res.status(200).send("Appeal has been rejected.");
  } catch (err) {
    next(err);
  }
};

const getUniversities = async (req, res, next) => {
  try {
    const universities = await User.distinct("university", { 
      role: "po", 
      "poVerification.status": "approved" 
    });
    res.status(200).json(universities);
  } catch (err) {
    next(err);
  }
};

const resubmitVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    if (user.reliabilityStatus === "suspended") {
      return next(createError(403, "Your account is suspended. You cannot resubmit verification!"));
    }

    const { role } = user;
    let updateData = {};

    if (role === "hr") {
      updateData = {
        "hrVerification.status": "pending",
        "hrVerification.rejectionReason": "",
        ...Object.keys(req.body).reduce((acc, key) => {
          acc[`hrVerification.${key}`] = req.body[key];
          return acc;
        }, {})
      };
    } else if (role === "po") {
      updateData = {
        "poVerification.status": "pending",
        "poVerification.rejectionReason": "",
        ...Object.keys(req.body).reduce((acc, key) => {
          acc[`poVerification.${key}`] = req.body[key];
          return acc;
        }, {})
      };
    } else {
      return next(createError(400, "Only HR or PO accounts can resubmit verification!"));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateData },
      { new: true }
    );

    const { password, ...info } = updatedUser._doc;
    res.status(200).send(info);
  } catch (err) {
    next(err);
  }
};

const submitProfileUpdateRequest = async (req, res, next) => {
  try {
    const { requestedChanges, proofs } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    if (user.reliabilityStatus === "suspended" && (user.role === "po" || user.role === "hr")) {
      return next(createError(403, "Your account is suspended. You cannot submit profile update requests!"));
    }

    // Only students/business/premium users usually need this for placement profiles
    user.profileUpdateRequests.push({
      requestedChanges,
      proofs: proofs || [],
      status: "pending",
      createdAt: new Date()
    });

    await user.save();
    res.status(200).send("Your profile update request has been submitted to admin.");
  } catch (err) {
    next(err);
  }
};

const getProfileUpdateRequests = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can see requests!"));
    
    // Find users who have at least one pending request
    const usersWithRequests = await User.find({
      "profileUpdateRequests.status": "pending"
    }).select("username email profileUpdateRequests");

    // Flatten requests with user context
    const allRequests = usersWithRequests.flatMap(u => 
      u.profileUpdateRequests
        .filter(r => r.status === "pending")
        .map(r => ({
          userId: u._id,
          username: u.username,
          email: u.email,
          requestId: r._id,
          requestedChanges: r.requestedChanges,
          proofs: r.proofs,
          createdAt: r.createdAt
        }))
    );

    res.status(200).json(allRequests);
  } catch (err) {
    next(err);
  }
};

const handleProfileUpdateRequest = async (req, res, next) => {
  try {
    if (!req.isAdmin) return next(createError(403, "Only admins can handle requests!"));
    
    const { userId, requestId, action, rejectionReason } = req.body;

    const user = await User.findById(userId);
    if (!user) return next(createError(404, "User not found!"));

    const request = user.profileUpdateRequests.id(requestId);
    if (!request) return next(createError(404, "Request not found!"));

    if (action === "approve") {
      request.status = "approved";
      
      // Handle proofs
      if (request.proofs && request.proofs.length > 0) {
        const transcriptProofs = request.proofs.filter(p => p.label === "Transcript");
        if (transcriptProofs.length > 0) {
          if (!user.studentVerification) user.studentVerification = { transcripts: [] };
          if (!user.studentVerification.transcripts) user.studentVerification.transcripts = [];
          
          transcriptProofs.forEach(tp => {
            if (!user.studentVerification.transcripts.includes(tp.url)) {
              user.studentVerification.transcripts.push(tp.url);
            }
          });
          user.studentVerification.status = "approved";
        }

        const idProofs = request.proofs.filter(p => p.label === "College ID");
        if (idProofs.length > 0) {
          if (!user.studentVerification) user.studentVerification = {};
          user.studentVerification.collegeId = idProofs[0].url;
          user.studentVerification.status = "approved";
        }
      }

      // Apply changes to user profile
      const changes = request.requestedChanges;
      for (let [key, value] of changes) {
        if (key === "resumeUrl") {
          if (!user.resumeData) user.resumeData = {};
          user.resumeData.url = value;
        } else if (key === "parsedSkills") {
          if (!user.resumeData) user.resumeData = {};
          user.resumeData.parsedSkills = value;
        } else if (key === "graduationYear") {
          user.graduationYear = Number(value);
        } else if (key.includes('.')) {
          const keys = key.split('.');
          let current = user;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
        } else {
          user[key] = value;
        }
      }
    } else {
      request.status = "rejected";
      request.rejectionReason = rejectionReason || "No reason provided";
    }

    await user.save();
    res.status(200).send(`Profile update request ${action}d successfully.`);
  } catch (err) {
    next(err);
  }
};

const getHRsForStudents = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== "student") return next(createError(403, "Student access required!"));
    if (user.subscription !== "business") return next(createError(403, "Only Business tier students can access the HR Directory!"));

    const { companyName } = req.query;
    let query = {
      role: "hr",
      "hrVerification.status": "approved",
      "hrVerification.isProfileVisible": true,
    };

    if (companyName) {
      query["hrVerification.companyName"] = { $regex: companyName, $options: "i" };
    }

    const hrs = await User.find(query)
      .select("username email hrVerification.companyName desc img")
      .sort({ "hrVerification.companyName": 1 });

    res.status(200).json(hrs);
  } catch (err) {
    next(err);
  }
};

const getPOAnalytics = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    const students = await User.find({ university: po.university, role: "student" });
    const businessStudents = students.filter(s => s.subscription === "business");
    
    // 1. AVG ATS Score (All Students)
    const totalAts = students.reduce((acc, s) => acc + (s.resumeData?.atsScore || 0), 0);
    const avgAts = students.length > 0 ? (totalAts / students.length).toFixed(1) : 0;

    // 2. Placement Readiness (Business Tier only)
    const readyStudents = businessStudents.filter(s => 
      (s.resumeData?.atsScore || 0) > 70 && 
      s.studentVerification?.status === "approved"
    );

    // 3. Placement Tracking (Company-wise & Stats)
    const studentIds = students.map(s => s._id);
    const hiredApps = await Application.find({ 
      studentId: { $in: studentIds }, 
      status: "hired" 
    }).populate("jobId", "companyName jobRole isOnCampus ctc stipend numericCtc")
    .populate("studentId", "username img university resumeData subscription");

    const companyStats = {};
    let totalPackage = 0;
    let placedCount = 0;
    const brackets = {
      under5: 0,
      fiveToTen: 0,
      aboveTen: 0
    };

    hiredApps.forEach(app => {
      if (!app.jobId) return;
      
      // Count only Business tier for placement % and avg package
      if (app.studentId.subscription === "business") {
        placedCount++;
        const pkg = app.offeredPackage || app.jobId.numericCtc || 0;
        totalPackage += pkg;

        if (pkg < 5) brackets.under5++;
        else if (pkg <= 10) brackets.fiveToTen++;
        else brackets.aboveTen++;
      }

      const company = app.jobId.companyName;
      if (!companyStats[company]) {
        companyStats[company] = {
          count: 0,
          students: []
        };
      }
      companyStats[company].count++;
      companyStats[company].students.push({
        _id: app.studentId._id,
        username: app.studentId.username,
        img: app.studentId.img,
        atsScore: app.studentId.resumeData?.atsScore || 0,
        jobRole: app.jobId.jobRole,
        isOnCampus: app.jobId.isOnCampus,
        package: app.offeredPackage || app.jobId.numericCtc || app.jobId.ctc || app.jobId.stipend || 0,
        offerType: app.offerType || (app.jobId.isOnCampus ? "On-Campus" : "Off-Campus")
      });
    });

    const avgPackage = placedCount > 0 ? (totalPackage / placedCount).toFixed(2) : 0;
    const placementRate = businessStudents.length > 0 ? ((placedCount / businessStudents.length) * 100).toFixed(1) : 0;

    res.status(200).json({
      avgAts,
      totalStudents: students.length,
      businessCount: businessStudents.length,
      readyCount: readyStudents.length,
      placedCount,
      unplacedCount: businessStudents.length - placedCount,
      placementRate,
      avgPackage,
      brackets,
      topTalent: students
        .filter(s => (s.resumeData?.atsScore || 0) > 0)
        .sort((a, b) => (b.resumeData?.atsScore || 0) - (a.resumeData?.atsScore || 0))
        .slice(0, 5),
      companyStats
    });
  } catch (err) {
    next(err);
  }
};

const getPOStudents = async (req, res, next) => {
  try {
    const po = await User.findById(req.userId);
    if (!po || po.role !== "po") return next(createError(403, "Access denied!"));

    const students = await User.find({ university: po.university, role: "student" })
      .select("username img subscription resumeData studentVerification isPlacementReady branch governance");

    const studentData = await Promise.all(students.map(async (s) => {
      // Find if student is hired
      const hiredApp = await Application.findOne({ studentId: s._id, status: "hired" })
        .populate("jobId", "companyName jobRole isOnCampus");

      let status = "Unplaced";
      if (s.subscription === "premium") {
        status = "Career Growth";
      } else if (hiredApp) {
        status = "Placed";
      }

      const latestApp = await Application.findOne({ studentId: s._id })
        .sort({ updatedAt: -1 })
        .populate("jobId", "companyName jobRole isOnCampus");
      
      return {
        ...s._doc,
        placementStatus: status,
        track: s.subscription === "business" ? "Placement Track" : "Skill Track",
        latestJob: latestApp ? latestApp.jobId : null,
        hiredIn: hiredApp ? hiredApp.jobId?.companyName : null
      };
    }));

    res.status(200).json(studentData);
  } catch (err) {
    next(err);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json(notifications);
  } catch (err) {
    next(err);
  }
};

const markNotificationAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return next(createError(404, "Notification not found!"));
    if (notification.userId.toString() !== req.userId) return next(createError(403, "Access denied!"));

    notification.isRead = true;
    await notification.save();
    res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
};

const markAllNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.userId, isRead: false }, { $set: { isRead: true } });
    res.status(200).send("All notifications marked as read.");
  } catch (err) {
    next(err);
  }
};

const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ userId: req.userId });
    res.status(200).send("All notifications cleared.");
  } catch (err) {
    next(err);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return next(createError(404, "Notification not found!"));
    if (notification.userId.toString() !== req.userId) return next(createError(403, "Access denied!"));

    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).send("Notification deleted.");
  } catch (err) {
    next(err);
  }
};

const activateSeller = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return next(createError(404, "User not found!"));

    user.isVendor = true;
    await user.save();

    const { password, ...info } = user._doc;
    res.status(200).send(info);
  } catch (err) {
    next(err);
  }
};

const checkPOExists = async (req, res, next) => {
  try {
    const { university } = req.params;
    if (!university) return next(createError(400, "University name is required!"));

    const po = await User.findOne({
      role: "po",
      university: { $regex: new RegExp("^" + university.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "$", "i") },
      "poVerification.status": "approved"
    });

    res.status(200).json({ exists: !!po });
  } catch (err) {
    next(err);
  }
};

const Application = require("../models/Application");

module.exports = { 
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
  activateSeller,
  checkPOExists,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
  deleteNotification
};
