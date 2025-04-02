const mongoose = require("mongoose");
const Attendance = require("../models/Attendance");

const MINIMUM_WORK_HOURS = 10; // ✅ Minimum hours for "Present"
const EARLY_DEPARTURE_HOURS = 5; // ✅ Less than this is "On Leave"
const AUTO_CHECKOUT_HOUR = 20; // ✅ Auto-checkout at 8 PM

/**
 * ✅ Check if staff has already checked in today.
 */
const hasCheckedIn = async (staffId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return await Attendance.exists({ 
        staff: staffId, 
        checkInTime: { $gte: today, $lt: tomorrow } 
    });
};

/**
 * ✅ Check if staff has already checked out today.
 */
const hasCheckedOut = async (staffId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const attendance = await Attendance.findOne({ 
        staff: staffId, 
        checkOutTime: { $gte: today, $lt: tomorrow } 
    });
    return attendance && attendance.checkOutTime;
};

/**
 * 🚀 Staff Clock-In (Start Work) with Late Arrival Detection
 */
const startWork = async (staffId) => {
    const today = new Date();
    const todayFormatted = today.toISOString().split("T")[0];

    if (await hasCheckedIn(staffId)) {
        throw new Error("You have already checked in today.");
    }

    // 9 AM Start Time based on today's local time
    const scheduledStartTime = new Date(today.setHours(9, 0, 0, 0));
    const checkInTime = new Date();
    // Set status based on check-in time vs scheduled start time
    let status = checkInTime > scheduledStartTime ? "Late Arrival" : "Present";
    // Auto-mark Sundays as "Declared Holiday"
    if (today.getDay() === 0) status = "Declared Holiday";

    const attendance = new Attendance({
        staff: staffId,
        date: todayFormatted,
        checkInTime,
        status,
    });

    return await attendance.save();
};

/**
 * 🚀 Staff Clock-Out (End Work) with Correct Work Hour Calculation
 */
const endWork = async (staffId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const attendance = await Attendance.findOne({ 
        staff: staffId, 
        date: { $gte: today, $lt: tomorrow } 
    });
    if (!attendance) {
        throw new Error("You haven't checked in today.");
    }
    if (attendance.checkOutTime) {
        throw new Error("You've already checked out.");
    }

    const checkOutTime = new Date();
    const totalHours = calculateWorkedHours(attendance.checkInTime, checkOutTime);

    let status = "Present";
    if (totalHours < MINIMUM_WORK_HOURS) {
        status = totalHours > EARLY_DEPARTURE_HOURS ? "Early Departure" : "On Leave";
    }
    if (attendance.checkInTime.getHours() > 9 && totalHours < MINIMUM_WORK_HOURS) {
        status = "Late Arrival";
    }

    attendance.checkOutTime = checkOutTime;
    attendance.totalHours = totalHours;
    attendance.status = status;

    return await attendance.save();
};

/**
 * ✅ Auto Check-Out at 8 PM for Staff Who Forgot to Check-Out
 */
const autoCheckOutAll = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const checkOutTime = new Date();
    checkOutTime.setHours(AUTO_CHECKOUT_HOUR, 0, 0, 0);

    await Attendance.updateMany(
        { checkOutTime: null, checkInTime: { $gte: today, $lt: tomorrow } },
        [
            {
                $set: {
                    checkOutTime: checkOutTime,
                    totalHours: {
                        $divide: [
                            { $subtract: [checkOutTime, "$checkInTime"] },
                            1000 * 60 * 60
                        ]
                    },
                    status: {
                        $cond: [
                            { $gte: [{ $divide: [{ $subtract: [checkOutTime, "$checkInTime"] }, 1000 * 60 * 60] }, MINIMUM_WORK_HOURS] },
                            "Present",
                            {
                                $cond: [
                                    { $gt: [{ $divide: [{ $subtract: [checkOutTime, "$checkInTime"] }, 1000 * 60 * 60] }, EARLY_DEPARTURE_HOURS] },
                                    "Early Departure",
                                    "On Leave"
                                ]
                            }
                        ]
                    }
                }
            }
        ]
    );

    console.log(`✅ Auto check-out completed for all pending users.`);
};

/**
 * 🔹 Helper Function to Calculate Worked Hours (Fixes Midnight Crossover)
 */
const calculateWorkedHours = (checkInTime, checkOutTime) => {
    let totalMinutes = Math.abs(checkOutTime - checkInTime) / (1000 * 60);
    return parseFloat((totalMinutes / 60).toFixed(2));
};

/**
 * 🚀 Fetch All Attendance Records (Admin)
 */
const getAllAttendance = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return await Attendance.find({})
        .populate("staff", "name email")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
};

/**
 * 🚀 Fetch Attendance for Specific Date (Admin Only)
 */
const getAttendanceByDate = async (date) => {
    const formattedDate = new Date(date).toISOString().split("T")[0];
    return await Attendance.find({ date: formattedDate })
        .populate("staff", "name email")
        .sort({ staff: 1 })
        .lean();
};

/**
 * 🚀 Fetch Attendance Records for a Specific Staff Member (Admin Only, with Pagination)
 */
const getAttendanceByStaff = async (staffId, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return await Attendance.find({ staff: new mongoose.Types.ObjectId(staffId) })
        .populate("staff", "name email")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
};

/**
 * 🚀 Declare Past Leave for All Staff (Admin Only) - Prevents Duplicate Leave Entries
 */
const declareLeaveForPastDate = async (date, reason) => {
    const formattedDate = new Date(date).toISOString().split("T")[0];
    return await Attendance.updateMany(
        { date: formattedDate, status: { $ne: "On Leave" } },
        { $set: { status: "On Leave", reason } }
    );
};

const getOngoingAttendance = async () => {
    try {
        const activeSession = await Attendance.findOne({ status: "Ongoing" });
        return activeSession;
    } catch (error) {
        console.error("❌ Error fetching ongoing attendance:", error);
        throw new Error("Failed to fetch ongoing attendance");
    }
};

module.exports = {
    hasCheckedIn,
    hasCheckedOut,
    startWork,
    endWork,
    autoCheckOutAll,
    getAttendanceByDate,
    declareLeaveForPastDate,
    getAllAttendance,
    getAttendanceByStaff,
    getOngoingAttendance
};
