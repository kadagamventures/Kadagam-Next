const express = require("express");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../../middlewares/authMiddleware");
const projectReportController = require("../../controllers/reportControllers/projectReportController");

// ✅ Apply Authentication Middleware (All routes require authentication)
router.use(verifyToken);

// ✅ Admin Routes (Require Admin Role)
router.get("/live-overview", requireAdmin, projectReportController.getLiveProjectOverview); // 📍 Fetch Live Project Stats
router.get("/monthly-report", requireAdmin, projectReportController.generateMonthlyProjectReport); // 📍 Generate Monthly Report
router.get("/monthly-report/download", requireAdmin, projectReportController.downloadMonthlyProjectReport); // 📍 Download Report
router.delete("/cleanup-old-reports", requireAdmin, projectReportController.cleanupOldProjectReports); // 📍 Cleanup Expired Reports

module.exports = router;
