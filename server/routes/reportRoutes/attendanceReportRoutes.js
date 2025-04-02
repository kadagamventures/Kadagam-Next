const express = require("express");
const router = express.Router();
const attendanceReportController = require("../../controllers/reportControllers/attendanceReportController");
const { verifyToken, requireAdmin } = require("../../middlewares/authMiddleware"); 
const { query, validationResult } = require("express-validator");

/**
 * ✅ Middleware to validate request queries
 */
const validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

/**
 * 📆 Get Daily Attendance Report (Live Data)
 * ✅ Admins only
 */
router.get(
    "/daily",
    verifyToken,
    requireAdmin,
    [query("date", "Date is required and must be in YYYY-MM-DD format").isISO8601()],
    validateRequest,
    attendanceReportController.getDailyAttendanceReport
);

/**
 * 📅 Get Monthly Attendance Report (Uses Redis Caching)
 * ✅ Admins only
 */
router.get(
    "/monthly",
    verifyToken,
    requireAdmin,
    [
        query("month", "Month is required and must be between 1-12").isInt({ min: 1, max: 12 }),
        query("year", "Year is required and must be a valid four-digit year").isInt({ min: 2000, max: 2100 }),
    ],
    validateRequest,
    attendanceReportController.getMonthlyAttendanceReport
);

/**
 * 🖨 Download Monthly Attendance Report (PDF, Stored in AWS S3)
 * ✅ Admins only
 */
router.get(
    "/monthly/download",
    verifyToken,
    requireAdmin,
    [
        query("month", "Month is required and must be between 1-12").isInt({ min: 1, max: 12 }),
        query("year", "Year is required and must be a valid four-digit year").isInt({ min: 2000, max: 2100 }),
    ],
    validateRequest,
    attendanceReportController.downloadMonthlyAttendancePDF
);

/**
 * 📆 Get Yearly Attendance Summary (Uses Redis Caching)
 * ✅ Admins only
 */
router.get(
    "/yearly",
    verifyToken,
    requireAdmin,
    [query("year", "Year is required and must be a valid four-digit year").isInt({ min: 2000, max: 2100 })],
    validateRequest,
    attendanceReportController.getYearlyAttendanceSummary
);

/**
 * 🖨 Download Yearly Attendance Report (PDF, Stored in AWS S3)
 * ✅ Admins only
 */
router.get(
    "/yearly/download",
    verifyToken,
    requireAdmin,
    [query("year", "Year is required and must be a valid four-digit year").isInt({ min: 2000, max: 2100 })],
    validateRequest,
    attendanceReportController.downloadYearlyAttendancePDF
);

module.exports = router;
