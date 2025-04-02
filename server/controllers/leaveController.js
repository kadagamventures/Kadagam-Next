const leaveService = require("../services/leaveService");
const emailService = require("../services/emailService");
const asyncHandler = require("express-async-handler");

/**
 * ✅ Create a new leave or work-from-home request.
 */
const createLeaveRequest = asyncHandler(async (req, res) => {
    const { type, startDate, endDate, reason, contactEmail } = req.body;
    const staff = req.user.id;

    if (!type || !startDate || !endDate || !reason || !contactEmail) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }
    if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ success: false, message: "Start date cannot be after end date." });
    }

    const leaveData = { staff, type, startDate, endDate, reason, contactEmail };
    const leaveRequest = await leaveService.createLeaveRequest(leaveData);
    
    res.status(201).json({ success: true, message: "Leave request submitted successfully.", leaveRequest });
});

/**
 * ✅ Admin Declares Leave for All Staff.
 */
const declareLeaveForAll = asyncHandler(async (req, res) => {
    const { date, reason } = req.body;
    if (!date || !reason) {
        return res.status(400).json({ success: false, message: "Date and reason are required." });
    }
    await leaveService.declareLeaveForAll(date, reason);
    res.status(200).json({ success: true, message: `Leave declared for ${date} for all staff.` });
});

/**
 * ✅ Get all leave requests (Admin Only) with pagination.
 */
const getAllLeaveRequests = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const filter = status ? { status } : {};

    const leaveRequests = await leaveService.getLeaveRequests({ page, limit, filter });
    res.status(200).json({ success: true, leaveRequests });
});

/**
 * ✅ Get leave requests for a specific staff member.
 */
const getLeaveRequestsByStaff = asyncHandler(async (req, res) => {
    const { staffId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const leaveRequests = await leaveService.getLeaveRequests({ page, limit, filter: { staff: staffId } });
    res.status(200).json({ success: true, leaveRequests });
});

/**
 * ✅ Get all pending leave requests.
 */
const getPendingLeaveRequests = asyncHandler(async (req, res) => {
    const leaveRequests = await leaveService.getPendingLeaveRequests();
    res.status(200).json({ success: true, leaveRequests });
});

/**
 * ✅ Approve/Reject a leave request (Admin Only).
 * Sends an email notification to the staff.
 */
const updateLeaveRequest = asyncHandler(async (req, res) => {
    const { leaveId } = req.params;
    const { status } = req.body;
    const approvedBy = req.user.id;

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status. Must be 'approved' or 'rejected'." });
    }

    const updatedRequest = await leaveService.updateLeaveRequest(leaveId, { status, approvedBy });

    if (!updatedRequest) {
        return res.status(404).json({ success: false, message: "Leave request not found or already processed." });
    }

    res.status(200).json({ success: true, message: `Leave request ${status}.`, updatedRequest });
});

module.exports = {
    createLeaveRequest,
    declareLeaveForAll,
    getAllLeaveRequests,
    getLeaveRequestsByStaff,
    getPendingLeaveRequests,
    updateLeaveRequest,
};
