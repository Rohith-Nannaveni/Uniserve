const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const createError = require("../utils/createError");

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const { sendOTPEmail, sendResetOTPEmail } = require("../utils/email.util");

const register = async (req, res, next) => {
  try {
    const hashedPassword = bcrypt.hashSync(req.body.password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const newUser = new User({
      ...req.body,
      password: hashedPassword,
      otp,
      otpExpiry,
      isVerified: false,
      hrVerification: req.body.role === "hr" ? {
        status: "pending",
        companyName: req.body.companyName,
        workEmail: req.body.workEmail,
        proof: req.body.proof,
      } : { status: "none" },
      poVerification: req.body.role === "po" ? {
        status: "pending",
        department: req.body.department,
        proof: req.body.proof,
        authorityLetter: req.body.authorityLetter,
      } : { status: "none" },
    });

    await newUser.save();
    await sendOTPEmail(req.body.email, otp);
    res.status(201).send("User created. Please check your email for the OTP.");
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return next(createError(400, `${field.charAt(0).toUpperCase() + field.slice(1)} already exists!`));
    }
    next(err);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return next(createError(404, "User not found!"));
    if (!user.otp || user.otp !== otp) return next(createError(400, "Invalid OTP!"));
    if (user.otpExpiry < new Date()) return next(createError(400, "OTP has expired!"));

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).send("Account verified successfully!");
  } catch (err) {
    next(err);
  }
};

const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(createError(404, "User not found!"));

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    await sendOTPEmail(email, otp);

    res.status(200).send("OTP resent successfully!");
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(createError(404, "User not found!"));
    if (user.googleId) return next(createError(400, "This account uses Google sign-in. Please use Google to sign in."));

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendResetOTPEmail(email, otp);
    res.status(200).send("Password reset OTP sent to your email.");
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return next(createError(404, "User not found!"));
    if (!user.otp || user.otp !== otp) return next(createError(400, "Invalid OTP!"));
    if (user.otpExpiry < new Date()) return next(createError(400, "OTP has expired!"));

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.status(200).send("Password has been reset successfully!");
  } catch (err) {
    next(err);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, sub: googleId, name, picture } = payload;
    console.log("Google Auth Attempt:", { email, name });

    let user = await User.findOne({ email });

    if (user) {
      if (user.isBanned) return next(createError(403, "Your account has been banned!"));

      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }

      const token = jwt.sign(
        {
          id: user._id,
          isVendor: user.isVendor,
          isAdmin: user.isAdmin,
          role: user.role,
        },
        process.env.JWT_KEY
      );

      const { password, ...info } = user._doc;
      return res
        .cookie("accessToken", token, {
          httpOnly: true,
        })
        .status(200)
        .send(info);
    } else {
      // Return payload to frontend to let user choose username
      return res.status(200).send({
        isFirstTime: true,
        email,
        googleId,
        name,
        picture,
      });
    }
  } catch (err) {
    next(err);
  }
};

const completeGoogleAuth = async (req, res, next) => {
  try {
    const { email, googleId, username, name, picture, country } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) return next(createError(400, "Username already taken!"));

    const newUser = new User({
      username,
      email,
      googleId,
      img: picture,
      country: country || "India",
      isVerified: true, // Google accounts are verified
    });

    await newUser.save();

    const token = jwt.sign(
      {
        id: newUser._id,
        isVendor: newUser.isVendor,
        isAdmin: newUser.isAdmin,
      },
      process.env.JWT_KEY
    );

    const { password, ...info } = newUser._doc;
    res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(200)
      .send(info);
  } catch (err) {
    next(err);
  }
};

const checkUsername = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    res.status(200).send({ exists: !!user });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    console.log("Login attempt for:", req.body.username);
    const user = await User.findOne({ username: req.body.username });

    if (!user) {
      console.log("User not found:", req.body.username);
      return res.status(404).send("User not found!");
    }

    if (user.isBanned) return next(createError(403, "Your account has been banned!"));

    if (!user.isVerified && !user.googleId && !user.isAdmin) {
      return res.status(403).send("Please verify your account first!");
    }

    if (user.password) {
      const isCorrect = bcrypt.compareSync(req.body.password, user.password);
      if (!isCorrect) {
        return res.status(400).send("Wrong password or username!");
      }
    } else if (user.googleId) {
      return res.status(400).send("This account was created with Google. Please use Google Sign-in.");
    }

    const token = jwt.sign(
      {
        id: user._id,
        isVendor: user.isVendor,
        isAdmin: user.isAdmin,
      },
      process.env.JWT_KEY
    );

    const { password, ...info } = user._doc;
    res
      .cookie("accessToken", token, {
        httpOnly: true,
      })
      .status(200)
      .send(info);
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res) => {
  res
    .clearCookie("accessToken", {
      sameSite: "none",
      secure: true,
    })
    .status(200)
    .send("User has been logged out.");
};

module.exports = { register, login, logout, googleAuth, completeGoogleAuth, checkUsername, verifyOTP, resendOTP, forgotPassword, resetPassword };
