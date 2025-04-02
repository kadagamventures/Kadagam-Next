const express = require("express");
const { check } = require("express-validator");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const {
    generateTaskReport,
    downloadArchivedTaskReport,
    getLiveTaskStats,
    getTaskVisualizationData,
    getSelfTaskReport
} = require("../../controllers/reportControllers/taskReportController");

const { verifyToken, requireAdmin } = require("../../middlewares/authMiddleware");

// ✅ Rate Limiting: Prevent API Abuse (Max 5 requests per 10 minutes per user)
const reportRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,
    message: { success: false, message: "Too many requests, please try again later." },
});

// ✅ Middleware: Validate Year & Month Parameters
const validateYearMonth = [
    check("year").isInt({ min: 2000, max: new Date().getFullYear() }).withMessage("Year must be between 2000 and the current year."),
    check("month").isInt({ min: 1, max: 12 }).withMessage("Month must be between 1 and 12."),
];

// ✅ Middleware: Validate Report Type
const validateReportType = check("reportType")
    .isIn(["daily", "monthly", "yearly"])
    .withMessage("Invalid report type. Choose daily, monthly, or yearly.");

// 📍 All routes require authentication
router.use(verifyToken);

// 📍 Generate Task Report (Admin Only)
router.post(
    "/generate",
    requireAdmin,
    validateReportType,
    validateYearMonth,
    reportRateLimiter,
    async (req, res, next) => {
        try {
            const reportUrl = await generateTaskReport(req, res);
            return res.status(200).json({ success: true, reportUrl });
        } catch (error) {
            next(error);
        }
    }
);

// 📍 Download Archived Task Report (Admin Only)
router.get(
    "/download",
    requireAdmin,
    validateYearMonth,
    reportRateLimiter,
    async (req, res, next) => {
        try {
            const reportUrl = await downloadArchivedTaskReport(req, res);
            return res.status(200).json({ success: true, reportUrl });
        } catch (error) {
            next(error);
        }
    }
);

// 📍 Fetch Real-time Task Statistics (Admin Only)
router.get("/live-stats", requireAdmin, getLiveTaskStats);

// 📍 Fetch Task Visualization Data (Admin Only)
router.get("/visualization", requireAdmin, getTaskVisualizationData);

// 📍 Fetch Self Task Report (Staff Only)
router.get("/self", getSelfTaskReport);

module.exports = router;
