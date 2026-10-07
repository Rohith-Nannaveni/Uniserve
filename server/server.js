const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const { Server } = require("socket.io");
const http = require("http");

// Route imports (to be created)
const authRoute = require("./src/routes/auth.route");
const userRoute = require("./src/routes/user.route");
const serviceRoute = require("./src/routes/service.route");
const orderRoute = require("./src/routes/order.route");
const reviewRoute = require("./src/routes/review.route");
const conversationRoute = require("./src/routes/conversation.route");
const messageRoute = require("./src/routes/message.route");
const couponRoute = require("./src/routes/coupon.route");
const careerRoute = require("./src/routes/career.route");
const hrRoute = require("./src/routes/hr.route");
const poRoute = require("./src/routes/po.route");
const adminNewRoute = require("./src/routes/admin.route");
const proposalRoute = require("./src/routes/proposal.route");
const jobRoute = require("./src/routes/job.route");
const applicationRoute = require("./src/routes/application.route");
const reportRoute = require("./src/routes/report.route");
const branchRoute = require("./src/routes/branch.route");
const seedData = require("./seed");

const app = express();

// Middleware
// app.use(helmet());
// app.use(
//   cors({
//     origin: ["http://localhost:3000", "http://localhost:3001"],
//     credentials: true,
//   })
// );

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Database Connection
mongoose.set("strictQuery", true);
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
    // Automatically seed data if the database is empty
    await seedData();
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

// testing purpose

app.get("/", (req, res) => {
  res.status(200).json({
    message: "UniServe backend is running",
    status: "OK",
  });
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/services", serviceRoute);
app.use("/api/orders", orderRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/messages", messageRoute);
app.use("/api/coupons", couponRoute);
app.use("/api/career", careerRoute);
app.use("/api/hr", hrRoute);
app.use("/api/po", poRoute);
app.use("/api/admin-new", adminNewRoute);
app.use("/api/proposals", proposalRoute);
app.use("/api/jobs", jobRoute);
app.use("/api/applications", applicationRoute);
app.use("/api/reports", reportRoute);
app.use("/api/branch", branchRoute);

// Error Handling Middleware
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";
  return res.status(errorStatus).json({
    status: errorStatus,
    message: errorMessage,
  });
});

const server = http.createServer(app);

// Socket.io Setup
// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:3000", "http://localhost:3001"],
//   },
// });

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});


app.set("io", io);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  connect();
  console.log(`Backend server is running on port ${PORT}`);
});
