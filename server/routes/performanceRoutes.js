const express = require("express");
const router = express.Router();

const {
  getMyMonthlyPerformance,
  getMyYearlyPerformance,
  getMonthlyPerformanceByStaff,
  getYearlyPerformanceByStaff,
  getLivePerformanceSummary,
  getPerformanceVisualization,
  generateMonthlyPerformanceReport,
  getStaffPerformanceById,
  getMonthlyPerformanceById  // ✅ Import the new controller
} = require("../controllers/performanceController");

const { verifyToken, requireAdmin } = require("../middlewares/authMiddleware");

// ✅ Staff Routes (Self Performance View)
router.get("/self/monthly", verifyToken, getMyMonthlyPerformance);    // 📊 Staff: Monthly Performance
router.get("/self/yearly", verifyToken, getMyYearlyPerformance);      // 📊 Staff: Yearly Performance

// ✅ Staff & Admin: View Individual Staff Performance (Self or Admin)
router.get("/staff/:staffId", verifyToken, getStaffPerformanceById);

// ✅ New Route: Staff & Admin - View Staff's Monthly Detailed Performance (with month & year)
router.get("/staff/:staffId/monthly", verifyToken, getMonthlyPerformanceById);  // ✅ Monthly Staff Performance by ID

// ✅ Admin Routes (View Any Staff Performance by Month/Year)
router.get("/admin/staff/:staffId/monthly", verifyToken, requireAdmin, getMonthlyPerformanceByStaff);
router.get("/admin/staff/:staffId/yearly", verifyToken, requireAdmin, getYearlyPerformanceByStaff);

// ✅ Admin Dashboard - Live Summary, Charts, and Reports
router.get("/admin/live-summary", verifyToken, requireAdmin, getLivePerformanceSummary);            // 📈 Dashboard Live Summary
router.get("/admin/visualization", verifyToken, requireAdmin, getPerformanceVisualization);        // 📊 Charts / Graphs
router.get("/admin/monthly-report", verifyToken, requireAdmin, generateMonthlyPerformanceReport);  // 📝 Monthly Report PDF Download

module.exports = router;
