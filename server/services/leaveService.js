const Leave = require("../models/Leave");
const User = require("../models/User");
const emailService = require("./emailService");
const { format } = require("date-fns");

const COMPANY_LEAVE_EMAIL = process.env.COMPANY_LEAVE_EMAIL || "hr@kadagamventures.com";

const leaveService = {
    /**
     * ✅ Create a new leave or work-from-home request.
     */
    async createLeaveRequest(leaveData) {
        const { staff, startDate, endDate, type, contactEmail } = leaveData;

        if (new Date(startDate) > new Date(endDate)) {
            throw new Error("Start date cannot be after end date.");
        }

        // ✅ Prevent leave requests on declared leave days
        const isDeclaredLeave = await Leave.findOne({
            type: "declared_leave",
            $or: [
                { startDate: { $lte: new Date(endDate), $gte: new Date(startDate) } },
                { endDate: { $lte: new Date(endDate), $gte: new Date(startDate) } }
            ],
        });

        if (isDeclaredLeave) {
            throw new Error("This date has already been declared as leave for all staff.");
        }

        // ✅ Prevent duplicate leave requests
        const existingLeave = await Leave.findOne({
            staff,
            status: { $ne: "rejected" },
            $or: [
                { startDate: { $lte: new Date(endDate), $gte: new Date(startDate) } },
                { endDate: { $lte: new Date(endDate), $gte: new Date(startDate) } }
            ],
        });

        if (existingLeave) {
            throw new Error("You already have a leave request for this period.");
        }

        // ✅ Save leave request
        const leaveRequest = await Leave.create(leaveData);

        // ✅ Send leave request email to HR
        const leaveType = type === "leave" ? "Leave" : "Work From Home";
        const formattedStart = format(new Date(startDate), "yyyy-MM-dd");
        const formattedEnd = format(new Date(endDate), "yyyy-MM-dd");

        const subject = `New ${leaveType} Request from ${contactEmail}`;
        const text = `A new ${leaveType} request has been submitted by ${contactEmail}.\n\n` +
            `📅 Dates: ${formattedStart} - ${formattedEnd}\n` +
            `📝 Reason: ${leaveData.reason}\n\n` +
            `🔗 Please review the request on the admin dashboard.`;

        const html = `<p>A new <strong>${leaveType}</strong> request has been submitted by <strong>${contactEmail}</strong>.</p>
                      <p><strong>📅 Dates:</strong> ${formattedStart} - ${formattedEnd}</p>
                      <p><strong>📝 Reason:</strong> ${leaveData.reason}</p>
                      <p>🔗 <strong>Please review the request on the admin dashboard.</strong></p>`;

        await emailService.sendEmail(COMPANY_LEAVE_EMAIL, subject, text, html);

        return leaveRequest;
    },

    /**
     * ✅ Admin Declares Leave for All Staff
     */
    async declareLeaveForAll(date, reason) {
        const existingLeave = await Leave.findOne({ startDate: date, type: "declared_leave" });
        if (existingLeave) {
            throw new Error("Leave for this date has already been declared.");
        }

        const staffList = await User.find({ role: "staff" }).select("_id");
        const leaveRequests = staffList.map(staff => ({
            staff: staff._id,
            type: "declared_leave",
            startDate: date,
            endDate: date,
            status: "approved",
            reason,
        }));

        await Leave.insertMany(leaveRequests);
    },

    /**
     * ✅ Get all leave requests (for admin panel) with pagination.
     */
    async getLeaveRequests({ page = 1, limit = 10, filter = {} } = {}) {
        // Ensure page and limit are valid numbers
        page = Number(page) || 1;
        limit = Number(limit) || 10;
    
        const skip = (page - 1) * limit;
    
        const leaveRequests = await Leave.find(filter)
            .populate("staff", "name email")
            .sort({ status: 1, startDate: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    
        const totalRecords = await Leave.countDocuments(filter);
    
        return {
            totalRecords,
            totalPages: Math.ceil(totalRecords / limit),
            currentPage: page,
            leaveRequests,
        };
    },

    /**
     * ✅ Fetch all pending leave requests.
     */
    async getPendingLeaveRequests() {
        return await Leave.find({ status: "pending" })
            .populate("staff", "name email")
            .sort({ startDate: -1 })
            .lean();
    },

    /**
     * ✅ Approve/Reject a leave request (Admin action).
     * Saves approvedBy and sends an email notification to the staff.
     */
    async updateLeaveRequest(leaveId, updateData) {
        const { status, approvedBy } = updateData;

        if (!["approved", "rejected"].includes(status)) {
            throw new Error("Invalid status. Must be 'approved' or 'rejected'.");
        }

        const leaveRequest = await Leave.findById(leaveId).populate("staff", "email").lean();
        if (!leaveRequest) {
            throw new Error("Leave request not found.");
        }

        if (leaveRequest.status !== "pending") {
            throw new Error("This leave request has already been processed.");
        }

        const updatedLeave = await Leave.findByIdAndUpdate(
            leaveId,
            { status, approvedBy },
            { new: true }
        ).populate("staff", "email").lean();

        if (!updatedLeave) return null;

        // ✅ Send email notification to staff
        const leaveType = updatedLeave.type === "leave" ? "Leave" : "Work From Home";
        const statusText = status === "approved" ? "Approved ✅" : "Rejected ❌";
        const formattedStart = format(new Date(updatedLeave.startDate), "yyyy-MM-dd");
        const formattedEnd = format(new Date(updatedLeave.endDate), "yyyy-MM-dd");

        const subject = `Your ${leaveType} Request Has Been ${status.toUpperCase()}`;
        const text = `Hello,\n\nYour request for ${leaveType} from ${formattedStart} to ${formattedEnd} has been ${status.toUpperCase()}.\n\n` +
            `📝 Reason provided: ${updatedLeave.reason}\n\n` +
            `If you have any concerns, please contact your manager.`;

        const html = `<p>Hello,</p>
                      <p>Your request for <strong>${leaveType}</strong> from <strong>${formattedStart}</strong> to <strong>${formattedEnd}</strong> has been <strong>${statusText}</strong>.</p>
                      <p><strong>📝 Reason provided:</strong> ${updatedLeave.reason}</p>
                      <p>If you have any concerns, please contact your manager.</p>`;

        await emailService.sendEmail(updatedLeave.staff.email, subject, text, html);

        return updatedLeave;
    },
};

module.exports = leaveService;
