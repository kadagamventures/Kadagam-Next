const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const leaveReportService = require("../services/reportServices/leaveReportService");

const {
    createLeaveRequest,
    declareLeaveForAll,
    getAllLeaveRequests,
    getLeaveRequestsByStaff,
    getPendingLeaveRequests,
    updateLeaveRequest,
} = leaveController;

const { verifyToken, requireAdmin } = require("../middlewares/authMiddleware");
const { generalLimiter, adminLimiter } = require("../middlewares/rateLimiterMiddleware");

// ✅ Apply Authentication Middleware
router.use(verifyToken);

// 📍 Staff Routes - Request & View Leave
router.post("/", generalLimiter, createLeaveRequest);
router.get("/my-leaves", getLeaveRequestsByStaff);

// 📍 Admin Routes - Manage Leave Requests
router.get("/", requireAdmin, adminLimiter, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const leaveRequests = await getAllLeaveRequests(status, page, limit);
        res.status(200).json({ success: true, leaveRequests });
    } catch (error) {
        console.error("Error fetching leave requests:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.get("/staff/:staffId", requireAdmin, adminLimiter, getLeaveRequestsByStaff);
router.put("/:leaveId", requireAdmin, adminLimiter, updateLeaveRequest);

// ✅ Fetch Pending Leave Requests (Admin Only)
router.get("/pending", requireAdmin, adminLimiter, getPendingLeaveRequests);

// ✅ Approve Leave Request
router.patch("/approve/:leaveId", requireAdmin, adminLimiter, async (req, res) => {
    req.body.status = "approved";
    await updateLeaveRequest(req, res);
});

// ✅ Reject Leave Request
router.patch("/reject/:leaveId", requireAdmin, adminLimiter, async (req, res) => {
    req.body.status = "rejected";
    await updateLeaveRequest(req, res);
});

// ✅ Admin Declares Past Date as Company-Wide Leave
router.post("/declare-leave", requireAdmin, adminLimiter, declareLeaveForAll);

// 📍 Leave Reports (Admin Only)
router.get("/reports/monthly/:year/:month", requireAdmin, adminLimiter, async (req, res) => {
    const year = parseInt(req.params.year, 10);
    const month = parseInt(req.params.month, 10);

    try {
        const report = await leaveReportService.getMonthlyLeaveReport(year, month);
        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error("Error fetching monthly leave report:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.get("/reports/yearly/:year", requireAdmin, adminLimiter, async (req, res) => {
    const year = parseInt(req.params.year, 10);

    try {
        const report = await leaveReportService.getYearlyLeaveReport(year);
        res.status(200).json({ success: true, report });
    } catch (error) {
        console.error("Error fetching yearly leave report:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

router.get("/reports/yearly/:year/download", requireAdmin, adminLimiter, async (req, res) => {
    const year = parseInt(req.params.year, 10);

    try {
        const reportUrl = await leaveReportService.getOrGenerateYearlyLeaveReport(year);
        res.status(200).json({ success: true, reportUrl });
    } catch (error) {
        console.error("Error downloading yearly leave report:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
