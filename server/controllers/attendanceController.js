const attendanceService = require("../services/attendanceService");
const asyncHandler = require("express-async-handler");

/**
 * 🚀 Staff Clock-In (Start Work) - Persists Attendance Tracking
 */
const startWork = asyncHandler(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }
    const staffId = req.user.id;

    if (await attendanceService.hasCheckedIn(staffId)) {
        return res.status(400).json({ success: false, message: "You have already checked in today." });
    }

    const attendance = await attendanceService.startWork(staffId);

    res.status(201).json({ 
        success: true, 
        message: "Workday started successfully.", 
        data: attendance 
    });
});

/**
 * 🚀 Staff Clock-Out (End Work)
 */
const endWork = asyncHandler(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }
    const staffId = req.user.id;

    if (!(await attendanceService.hasCheckedIn(staffId))) {
        return res.status(400).json({ success: false, message: "You need to check in first." });
    }

    if (await attendanceService.hasCheckedOut(staffId)) {
        return res.status(400).json({ success: false, message: "You have already checked out today." });
    }

    const attendance = await attendanceService.endWork(staffId);

    res.status(200).json({ 
        success: true, 
        message: "Workday ended successfully.", 
        data: attendance 
    });
});

/**
 * 🚀 Fetch Ongoing Attendance Session (Persists Session on Login)
 */
const getOngoingAttendance = asyncHandler(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }
    
    const staffId = req.user.id;
    const ongoingSession = await attendanceService.getOngoingAttendance(staffId);

    res.status(200).json({ 
        success: true, 
        data: ongoingSession || {} 
    });
});

/**
 * 🚀 Fetch All Attendance Records (Admin Only, with Pagination)
 */
const getAllAttendance = asyncHandler(async (req, res) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const records = await attendanceService.getAllAttendance(page, limit);

    res.status(200).json({ success: true, data: records });
});

/**
 * 🚀 Fetch Attendance for a Specific Staff Member (Admin Only, with Pagination)
 */
const getAttendanceByStaff = asyncHandler(async (req, res) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    const { staffId } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const records = await attendanceService.getAttendanceByStaff(staffId, page, limit);

    res.status(200).json({ success: true, data: records });
});

/**
 * 🚀 Fetch Attendance for a Specific Date (Admin Only)
 */
const getAttendanceByDate = asyncHandler(async (req, res) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    const { date } = req.params;
    const records = await attendanceService.getAttendanceByDate(date);

    res.status(200).json({ success: true, data: records });
});

/**
 * 🚀 Fetch Logged-in Staff's Attendance Records (Staff Dashboard View)
 */
const getOwnAttendance = asyncHandler(async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const staffId = req.user.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const records = await attendanceService.getAttendanceByStaff(staffId, page, limit);

    res.status(200).json({ success: true, data: records });
});

/**
 * 🚀 Admin Declares Past Leave for All Staff
 */
const declareLeaveForPastDate = asyncHandler(async (req, res) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Access denied. Admins only." });
    }

    const { date, reason } = req.body;

    if (!date || !reason) {
        return res.status(400).json({ success: false, message: "Date and reason are required." });
    }

    const formattedDate = new Date(date).toISOString().split("T")[0];

    // ✅ Update attendance records to "On Leave" only if not already declared
    const updatedRecords = await attendanceService.declareLeaveForPastDate(formattedDate, reason);

    if (!updatedRecords.modifiedCount) {
        return res.status(404).json({ success: false, message: "No attendance records found for this date." });
    }

    res.status(200).json({ 
        success: true, 
        message: `Leave declared for ${formattedDate} for all staff.`, 
        updatedRecords 
    });
});

const getActiveAttendance = asyncHandler(async (req, res) => {
    const staffId = req.user.id;
    const session = await attendanceService.getOngoingAttendance(staffId);
    if (!session) {
      return res.status(200).json({ isWorking: false });
    }
    const checkInTime = new Date(session.checkInTime);
    const now = new Date();
    const elapsedSeconds = Math.floor((now - checkInTime) / 1000);
    res.status(200).json({ 
      isWorking: true, 
      checkInTime: session.checkInTime,
      timer: elapsedSeconds
    });
  });

module.exports = {
    startWork,
    endWork,
    getOngoingAttendance,
    getAllAttendance,
    getAttendanceByStaff,
    getAttendanceByDate,
    getOwnAttendance,
    declareLeaveForPastDate,
    getActiveAttendance 
};
