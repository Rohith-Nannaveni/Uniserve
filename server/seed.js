const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const path = require("path");
const User = require("./src/models/User");
const Service = require("./src/models/Service");
const Coupon = require("./src/models/Coupon");

dotenv.config({ path: path.join(__dirname, ".env") });

const seedData = async () => {
  try {
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URL);
      console.log("Connected to MongoDB for seeding...");
    }

    // 1. Check if data already exists to avoid re-seeding
    const forceReset = process.env.FORCE_SEED === "true";
    const userCount = await User.countDocuments();
    console.log(`Current user count: ${userCount}`);
    
    if (userCount > 0 && !forceReset) {
      console.log("Database already contains users. Skipping initial seeding to prevent data duplication.");
      return;
    }

    if (forceReset) {
      console.log("Force reset enabled. Clearing existing data...");
      await User.deleteMany({});
      await Service.deleteMany({});
      await Coupon.deleteMany({});
    }

    console.log("No existing users found. Starting fresh data seeding for the marketplace...");
    
    // 2. Create Users
    const rawPassword = process.env.SEED_DEFAULT_PASSWORD;
    
    if (!rawPassword) {
      throw new Error("CRITICAL: SEED_DEFAULT_PASSWORD is missing from .env");
    }

    const salt = bcrypt.genSaltSync(10);
    const password = bcrypt.hashSync(rawPassword, salt);

    // Dynamic environment variables for personal data
    const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@uniserve.demo";
    const defaultPhone = process.env.SEED_DEFAULT_PHONE || "+814281428142";

    const users = [
      // Admin
      { username: "admin", email: adminEmail, password, country: "India", isVendor: true, isAdmin: true, isVerified: true, img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      
      // Providers
      { username: "yashaswin", email: "yashaswin@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Expert Full Stack Developer specializing in MERN stack.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "ghana", email: "ghana@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "AI Research Engineer and ML Expert.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "kathuri", email: "kathuri@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Creative Designer and Branding Specialist.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "yash", email: "yash@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Video Editor and Motion Graphics Artist.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "pandu", email: "pandu@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Digital Marketer and SEO Consultant.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },

      // Buyers
      { username: "buyer1", email: "buyer1@uniserve.com", password, country: "India", isVendor: false, isVerified: true, img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "buyer2", email: "buyer2@uniserve.com", password, country: "India", isVendor: false, isVerified: true, img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "buyer3", email: "buyer3@uniserve.com", password, country: "India", isVendor: false, isVerified: true, img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },

      // Extra
      { username: "chetan", email: "chetan@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Content Writer and Translator.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "krishna", email: "krishna@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Music Producer and Audio Engineer.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "sumi", email: "sumi@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Lifestyle Coach and Wellness Expert.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "manaswin", email: "manaswin@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Professional Voice Over Artist.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      
      // New Vendors
      { username: "uma", email: "uma@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Data Scientist and AI Specialist.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "ramana", email: "ramana@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Business Strategy Consultant.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "venkat", email: "venkat@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Senior Software Architect.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "rani", email: "rani@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "UI/UX Designer and Illustrator.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "srikanth", email: "srikanth@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Growth Marketer and Ads Expert.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "harshitha", email: "harshitha@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Copywriter and Editor.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "uzzwal", email: "uzzwal@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Motion Graphics and 3D Artist.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" },
      { username: "vanshik", email: "vanshik@uniserve.com", password, country: "India", isVendor: true, isVerified: true, desc: "Audio Engineer and Composer.", img: "/images/defaults/profile-default-ai.png", phone: defaultPhone, qrCode: "/images/defaults/payment-qr-default.jpeg" }
    ];

    const createdUsers = await User.insertMany(users);
    console.log("Users seeded.");

    const userMap = createdUsers.reduce((acc, user) => {
      acc[user.username] = user._id;
      return acc;
    }, {});

    // 3. Create Coupons
    const coupons = [
      { code: "WELCOME10", discount: 10, isPercentage: true, expiryDate: new Date("2026-12-31"), isActive: true },
      { code: "FESTIVE500", discount: 500, isPercentage: false, expiryDate: new Date("2026-12-31"), isActive: true },
    ];
    await Coupon.insertMany(coupons);
    console.log("Coupons seeded.");

    // 4. Create Services across all categories (at least 2 per category)
    const services = [
      // Graphics
      {
        userId: userMap["kathuri"],
        title: "Premium Brand Identity Design",
        desc: "Create a unique and memorable brand identity for your startup or business including logos and style guides.",
        cat: "graphics",
        price: 15000,
        cover: "/images/defaults/hero-default-graphics.png",
        shortTitle: "Branding Kit",
        shortDesc: "Logo & Brand Identity",
        deliveryTime: 7,
        revisionNumber: 10,
        features: ["Logo", "Social Kit", "Source Files", "Commercial Use"],
        isApproved: true
      },
      {
        userId: userMap["rani"],
        title: "Modern UI/UX Dashboard Design",
        desc: "User-centric dashboard and mobile app designs that convert.",
        cat: "graphics",
        price: 20000,
        cover: "/images/defaults/hero-default-graphics.png",
        shortTitle: "UI/UX Design",
        shortDesc: "Figma Prototypes",
        deliveryTime: 12,
        revisionNumber: 5,
        features: ["User Research", "Wireframes", "Interactive Prototypes"],
        isApproved: true
      },
      // Programming & Tech
      {
        userId: userMap["yashaswin"],
        title: "Full Stack Web App Development",
        desc: "Build scalable and responsive web applications using modern technologies like React, Node.js and MongoDB.",
        cat: "programming",
        price: 50000,
        cover: "/images/defaults/hero-default-webdev.png",
        shortTitle: "Full Web App",
        shortDesc: "End-to-end development",
        deliveryTime: 20,
        revisionNumber: 5,
        features: ["Frontend", "Backend", "Database", "API Integration"],
        isApproved: true
      },
      {
        userId: userMap["venkat"],
        title: "E-commerce Website Solution",
        desc: "High-performance e-commerce stores with payment integration and admin panel.",
        cat: "programming",
        price: 45000,
        cover: "/images/defaults/hero-default-webdev.png",
        shortTitle: "E-com Site",
        shortDesc: "Scalable store",
        deliveryTime: 15,
        revisionNumber: 3,
        features: ["Product Management", "Payment Gateway", "Order Tracking"],
        isApproved: true
      },
      // New Specific Categories from Images
      {
        userId: userMap["rani"],
        title: "Professional Web Design",
        desc: "Custom web designs tailored to your brand identity.",
        cat: "web-design",
        price: 25000,
        cover: "/images/defaults/hero-default-webdev.png",
        shortTitle: "Web Design",
        shortDesc: "Custom Layouts",
        deliveryTime: 10,
        revisionNumber: 3,
        features: ["Responsive", "Modern UI", "Source Files"],
        isApproved: true
      },
      {
        userId: userMap["venkat"],
        title: "Complete WordPress Website Setup",
        desc: "Fully functional WordPress site with premium themes and plugins.",
        cat: "wordpress",
        price: 15000,
        cover: "/images/defaults/hero-default-tech.png",
        shortTitle: "WordPress Site",
        shortDesc: "Installation & Setup",
        deliveryTime: 5,
        revisionNumber: 2,
        features: ["Theme Customization", "SEO Ready", "Security Setup"],
        isApproved: true
      },
      {
        userId: userMap["kathuri"],
        title: "Unique Logo Design",
        desc: "Creative and minimalist logo designs for your brand.",
        cat: "graphics",
        price: 5000,
        cover: "/images/defaults/hero-default-graphics.png",
        shortTitle: "Logo Design",
        shortDesc: "3 Concepts",
        deliveryTime: 3,
        revisionNumber: 5,
        features: ["Vector Files", "High Res", "Fast Delivery"],
        isApproved: true
      },
      // Video & Animation
      {
        userId: userMap["yash"],
        title: "Professional Video Editing",
        desc: "High-quality video editing for YouTube, social media, or corporate use with cinematic effects.",
        cat: "video",
        price: 8000,
        cover: "/images/defaults/hero-default-video.png",
        shortTitle: "Video Edit",
        shortDesc: "Cinematic Editing",
        deliveryTime: 3,
        revisionNumber: 3,
        features: ["Color Grading", "Sound Design", "Motion Graphics", "1080p Output"],
        isApproved: true
      },
      {
        userId: userMap["uzzwal"],
        title: "2D Explainer Animations",
        desc: "Engaging 2D animations to explain your product or service simply.",
        cat: "video",
        price: 12000,
        cover: "/images/defaults/hero-default-video.png",
        shortTitle: "2D Animation",
        shortDesc: "Custom Explainer",
        deliveryTime: 10,
        revisionNumber: 4,
        features: ["Scriptwriting", "Voiceover", "Background Music"],
        isApproved: true
      },
      // Digital Marketing
      {
        userId: userMap["pandu"],
        title: "SEO & Social Media Management",
        desc: "Boost your online presence and organic traffic with professional SEO and targeted social media campaigns.",
        cat: "marketing",
        price: 12000,
        cover: "/images/defaults/hero-default-marketing.png",
        shortTitle: "SEO Growth",
        shortDesc: "Monthly Marketing",
        deliveryTime: 30,
        revisionNumber: 2,
        features: ["Keyword Research", "On-page SEO", "Backlink Strategy", "Analytics"],
        isApproved: true
      },
      {
        userId: userMap["srikanth"],
        title: "Google & Meta Ads Campaign",
        desc: "High-converting paid advertising campaigns for maximum ROI.",
        cat: "marketing",
        price: 15000,
        cover: "/images/defaults/hero-default-marketing.png",
        shortTitle: "Paid Ads",
        shortDesc: "Targeted Campaigns",
        deliveryTime: 7,
        revisionNumber: 2,
        features: ["Ad Copy", "Audience Targeting", "Conversion Tracking"],
        isApproved: true
      },
      // Writing & Translation
      {
        userId: userMap["chetan"],
        title: "SEO Content Writing",
        desc: "Engaging and SEO-optimized articles and blog posts for your website to drive traffic and engagement.",
        cat: "writing",
        price: 3000,
        cover: "/images/defaults/hero-default-writing.png",
        shortTitle: "Blog Post",
        shortDesc: "1000 Word Article",
        deliveryTime: 2,
        revisionNumber: 2,
        features: ["Original Content", "SEO Keywords", "Topic Research", "Proofreading"],
        isApproved: true
      },
      {
        userId: userMap["harshitha"],
        title: "Professional Website Copywriting",
        desc: "Compelling copy for your landing pages, about us, and product descriptions.",
        cat: "writing",
        price: 5000,
        cover: "/images/defaults/hero-default-writing.png",
        shortTitle: "Web Copy",
        shortDesc: "Engaging Content",
        deliveryTime: 4,
        revisionNumber: 3,
        features: ["Landing Page Copy", "Email Sequences", "Brand Voice"],
        isApproved: true
      },
      // Music & Audio
      {
        userId: userMap["krishna"],
        title: "Custom Music Production",
        desc: "Original background music, beats, and sound designs for your videos, games, or advertisements.",
        cat: "music",
        price: 10000,
        cover: "/images/defaults/hero-default-music.png",
        shortTitle: "Original Beat",
        shortDesc: "Custom Production",
        deliveryTime: 5,
        revisionNumber: 3,
        features: ["Mixing", "Mastering", "Commercial Rights", "HQ Audio"],
        isApproved: true
      },
      {
        userId: userMap["vanshik"],
        title: "Podcast Audio Cleanup & Master",
        desc: "Professional audio editing for podcasts - noise reduction, leveling, and mastering.",
        cat: "music",
        price: 4000,
        cover: "/images/defaults/hero-default-music.png",
        shortTitle: "Podcast Edit",
        shortDesc: "Clean & Master",
        deliveryTime: 2,
        revisionNumber: 2,
        features: ["Noise Removal", "Intro/Outro", "Leveling"],
        isApproved: true
      },
      // Data Science
      {
        userId: userMap["yashaswin"],
        title: "Advanced Data Analysis & Visualization",
        desc: "Transform your raw data into actionable insights with beautiful dashboards and detailed reports.",
        cat: "data-science",
        price: 15000,
        cover: "/images/defaults/hero-default-data.png",
        shortTitle: "Data Viz",
        shortDesc: "Insightful Dashboard",
        deliveryTime: 5,
        revisionNumber: 2,
        features: ["Data Cleaning", "Python/R", "Interactive Charts", "PDF Report"],
        isApproved: true
      },
      // AI
      {
        userId: userMap["ghana"],
        title: "Custom AI Model Training",
        desc: "Train custom machine learning models for your specific business needs.",
        cat: "ai",
        price: 60000,
        cover: "/images/defaults/hero-default-ai.jpeg",
        shortTitle: "AI Model",
        shortDesc: "Custom ML Models",
        deliveryTime: 14,
        revisionNumber: 3,
        features: ["Data Preparation", "Model Selection", "Training", "Deployment Support"],
        isApproved: true
      }
    ];

    await Service.insertMany(services);
    console.log("Services seeded.");

    console.log("Seeding process completed.");
  } catch (err) {
    console.error("Seeding error:", err);
  }
};

// If this file is run directly (node seed.js), then run the script
if (require.main === module) {
  seedData().then(() => {
    process.exit();
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = seedData;
