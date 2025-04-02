require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const http = require("http");
const mongoose = require("mongoose");
const compression = require("compression");

const { adminLimiter } = require("./middlewares/rateLimiterMiddleware");
const connectDB = require("./config/dbConfig");
const { connectRedis, redisClient } = require("./config/redisConfig");
const { initializeWebSocket } = require("./config/websocketConfig");
const { errorHandler, notFoundHandler } = require("./middlewares/errorMiddleware");

// ✅ Import API Routes
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const reportRoutes = require("./routes/reportRoutes");
const fileRoutes = require("./routes/fileRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const staffPermissionsRoutes = require("./routes/staffPermissionsRoutes");
const performanceRoutes = require("./routes/performanceRoutes");

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL ="https://kadagam-next.vercel.app";

// ✅ Connect to MongoDB & Redis
(async () => {
  try {
    await connectDB();
    console.log("🟢 MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }

  try {
    await connectRedis();
    console.log("🟢 Redis Connected");
  } catch (error) {
    console.error("❌ Redis Connection Error:", error);
  }
})();

// ✅ Fix CORS Issue (Allow Frontend)
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control",
    ],
  })
);

// ✅ Allow preflight (OPTIONS) requests globally
app.options("*", cors());

// ✅ Middleware
app.use(compression()); // Enable compression
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("combined")); // Use combined format for better logging

// ✅ Root Route (Fixes 404 for `/`)
app.get("/", (req, res) => {
  res.status(200).json({ message: "🟢 Welcome to Kadagam API! Use /api for API routes." });
});

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);
app.use("/api/staff", adminLimiter, userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", adminDashboardRoutes);
app.use("/api/staff", staffPermissionsRoutes);
app.use("/api/performance", performanceRoutes);

// ✅ 404 & Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// ✅ Initialize WebSockets
const server = http.createServer(app);
initializeWebSocket(server);

// ✅ Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 API available at http://localhost:${PORT}/api`);
  console.log(`📡 WebSocket listening on ws://localhost:${PORT}`);
});

// ✅ Graceful Shutdown
const shutdownHandler = async (signal) => {
  console.log(`🔴 Received ${signal}. Closing server...`);
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      console.log("🟢 Redis client closed.");
    }
  } catch (error) {
    console.error("❌ [Redis] Error while closing:", error);
  }

  try {
    console.log("🟢 Closing MongoDB connection...");
    await mongoose.connection.close();
  } catch (error) {
    console.error("❌ MongoDB Close Error:", error);
  }

  server.close(() => {
    console.log("🟢 Server shut down.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdownHandler("SIGINT"));
process.on("SIGTERM", () => shutdownHandler("SIGTERM"));

// ✅ Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});
