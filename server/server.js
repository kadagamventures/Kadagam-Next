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

// ✅ Routes
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

// ✅ Allow both dev & prod origins
const CLIENT_URLS = [
  "https://kadagam-next.vercel.app",
  "http://localhost:5173/",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || CLIENT_URLS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("❌ Not allowed by CORS"));
      }
    },
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

// ✅ Handle OPTIONS preflight
app.options("*", cors());

// ✅ Middleware
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan("combined"));

// ✅ Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP" });
});

// ✅ Root
app.get("/", (req, res) => {
  res.status(200).json({ message: "🟢 Welcome to Kadagam API! Use /api for API routes." });
});

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

// ✅ Routes
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

// ✅ Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ✅ Create HTTP Server
const server = http.createServer(app);

// ✅ Init WebSocket
initializeWebSocket(server);

// ✅ Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 API: http://localhost:${PORT}/api`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
});

// ✅ Graceful Shutdown
const shutdownHandler = async (signal) => {
  console.log(`🔴 Received ${signal}. Shutting down...`);

  try {
    if (redisClient?.isOpen) {
      await redisClient.quit();
      console.log("🟢 Redis disconnected.");
    }
  } catch (err) {
    console.error("❌ Redis shutdown error:", err);
  }

  try {
    await mongoose.connection.close();
    console.log("🟢 MongoDB disconnected.");
  } catch (err) {
    console.error("❌ MongoDB shutdown error:", err);
  }

  server.close(() => {
    console.log("🟢 Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdownHandler("SIGINT"));
process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
