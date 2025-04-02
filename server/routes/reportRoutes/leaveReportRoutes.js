const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const {
    getMonthlyLeaveReport,
    getYearlyLeaveReport,
    generateYearlyLeaveReport,
    cleanupOldLeaveReports
} = require("../../controllers/reportControllers/leaveReportController");

const { verifyToken, requireAdmin } = require("../../middlewares/authMiddleware");

// ✅ Middleware: Validate Year & Month Parameters
const validateYearMonth = [
    check("year").isInt({ min: 2000, max: new Date().getFullYear() }).withMessage("Invalid year."),
    check("month").isInt({ min: 1, max: 12 }).withMessage("Invalid month."),
];

// ✅ Middleware: Validate Year Only
const validateYear = [
    check("year").isInt({ min: 2000, max: new Date().getFullYear() }).withMessage("Invalid year."),
];

// 📍 All routes require authentication
router.use(verifyToken);

// 📍 Admin Routes (Require Admin Access)
router.get("/reports/monthly/:year/:month", validateYearMonth, requireAdmin, getMonthlyLeaveReport);
router.get("/reports/yearly/:year", validateYear, requireAdmin, getYearlyLeaveReport);
router.get("/reports/yearly/:year/download", validateYear, requireAdmin, generateYearlyLeaveReport);
router.delete("/reports/cleanup", requireAdmin, cleanupOldLeaveReports);

module.exports = router;
