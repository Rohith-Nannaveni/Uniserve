const optionalVerifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) {
    req.userId = null;
    req.isVendor = false;
    req.isAdmin = false;
    return next();
  }

  const jwt = require("jsonwebtoken");
  jwt.verify(token, process.env.JWT_KEY, async (err, payload) => {
    if (err) {
      req.userId = null;
      req.isVendor = false;
      req.isAdmin = false;
      return next();
    }
    req.userId = payload.id;
    req.isVendor = payload.isVendor;
    req.isAdmin = payload.isAdmin;
    next();
  });
};

module.exports = { optionalVerifyToken };
