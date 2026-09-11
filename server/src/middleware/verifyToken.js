const jwt = require("jsonwebtoken");
const createError = require("../utils/createError");
const User = require("../models/User");

const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return next(createError(401, "You are not authenticated!"));

  jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {
    if (err) return next(createError(403, "Token is not valid!"));
    
    // Real-time check for banned status
    try {
      const user = await User.findById(payload.id);
      if (!user) return next(createError(404, "User no longer exists!"));
      if (user.isBanned) return next(createError(403, "Your account has been banned!"));

      req.userId = payload.id;
      req.isVendor = user.isVendor;
      req.isAdmin = user.isAdmin;
      req.role = user.role;
      req.subscription = user.subscription;
      next();
    } catch (error) {
      next(error);
    }
  });
};

const verifyAdmin = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) return next(createError(401, "You are not authenticated!"));

  jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {
    if (err) return next(createError(403, "Token is not valid!"));
    
    try {
      const user = await User.findById(payload.id);
      if (!user) return next(createError(404, "User no longer exists!"));
      
      if (user.isAdmin) {
        req.userId = payload.id;
        req.isVendor = user.isVendor;
        req.isAdmin = user.isAdmin;
        req.role = user.role;
        req.subscription = user.subscription;
        next();
      } else {
        return next(createError(403, "You are not authorized! (Admin only)"));
      }
    } catch (error) {
      next(error);
    }
  });
};

module.exports = { verifyToken, verifyAdmin };
