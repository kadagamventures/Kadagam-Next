const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

const {
    startWork,
    endWork,
    getOwnAttendance,
    getAllAttendance,
    getAttendanceByStaff,
    getAttendanceByDate,
    declareLeaveForPastDate,
    getActiveAttendance
} = attendanceController;

const { verifyToken, requireAdmin } = require("../middlewares/authMiddleware"); 
const { generalLimiter, adminLimiter } = require("../middlewares/rateLimiterMiddleware");

// ✅ Apply Authentication Middleware for All Routes
router.use(verifyToken);

// 📍 Staff Routes - Clock In / Clock Out
router.post("/check-in", generalLimiter, startWork);
router.post("/check-out", generalLimiter, endWork);

// 📍 Staff View Own Attendance Records
router.get("/my-attendance", getOwnAttendance);

router.get("/active-session", verifyToken, getActiveAttendance);

// 📍 Admin Routes - Manage Attendance
router.get("/", requireAdmin, adminLimiter, getAllAttendance);

// 📍 Get Attendance for Specific Staff (Ensure ObjectId Format)
router.get("/staff/:staffId", requireAdmin, adminLimiter, async (req, res, next) => {
    try {
        const { staffId } = req.params;
        if (!staffId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: "Invalid staff ID format." });
        }
        await getAttendanceByStaff(req, res, next);
    } catch (error) {
        next(error);
    }
});

// 📍 Get Attendance by Date (Ensure Proper Date Format)
router.get("/date/:date", requireAdmin, adminLimiter, async (req, res, next) => {
    try {
        const { date } = req.params;
        const isValidDate = !isNaN(new Date(date).getTime());

        if (!isValidDate) {
            return res.status(400).json({ success: false, message: "Invalid date format." });
        }
        await getAttendanceByDate(req, res, next);
    } catch (error) {
        next(error);
    }
});

// ✅ Admin Declares Past Date as Company-Wide Leave
router.post("/declare-leave", requireAdmin, adminLimiter, declareLeaveForPastDate);

module.exports = router;
