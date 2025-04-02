const express = require("express");
const router = express.Router();
const staffReportController = require("../../controllers/reportControllers/staffReportController");
const { verifyToken, requireAdmin } = require("../../middlewares/authMiddleware");

// 📍 Middleware: Protect all routes with authentication
router.use(verifyToken);

// ===================== 👤 STAFF SELF-PERFORMANCE REPORTS ===================== \\

router.get("/self/monthly", staffReportController.getSelfMonthlyPerformance);
router.get("/self/yearly", staffReportController.getSelfYearlyPerformance);
router.get("/self/visualization", staffReportController.getSelfVisualizationData);

// ===================== 🏢 ADMIN DASHBOARD REPORTS ===================== \\

router.get("/admin/performance-overview", requireAdmin, staffReportController.getStaffPerformanceOverview);
router.get("/admin/:staffId/performance", requireAdmin, staffReportController.getSpecificStaffPerformance);
router.get("/admin/visualization", requireAdmin, staffReportController.getStaffVisualizationData);
router.get("/admin/attendance-monthly/download", requireAdmin, staffReportController.downloadStaffMonthlyReport);

module.exports = router;
