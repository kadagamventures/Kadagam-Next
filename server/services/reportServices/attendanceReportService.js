const Attendance = require("../../models/Attendance");
const User = require("../../models/User");
const { generateAttendanceReportPDF } = require("../../services/pdfService");
const { uploadReportFile } = require("../../services/awsService");
const redisClient = require("../../config/redisConfig").redisClient;
const ReportArchive = require("../../models/ReportArchive");

const REPORT_EXPIRATION_DAYS = 365;

/**
 * 📆 Get Daily Attendance Report (Live Attendance Data)
 */
const getDailyAttendanceReport = async (date) => {
    try {
        const filterDate = new Date(date);
        filterDate.setUTCHours(0, 0, 0, 0);

        // ✅ Fetch active staff roles only (exclude deleted staff)
        const activeStaff = await User.find({ isDeleted: false }).select("role").lean();
        const validRoles = activeStaff.map((user) => user.role);
        const totalStaff = activeStaff.length;

        const attendanceRecords = await Attendance.find({ date: filterDate })
            .populate({
                path: "staff",
                select: "name staffId role isDeleted",
                match: { isDeleted: false },
            })
            .lean();

        const validRecords = attendanceRecords.filter((record) => record.staff !== null);
        const presentStaff = validRecords.length;
        const absentStaff = totalStaff - presentStaff;

        const reportData = {
            date: filterDate,
            totalStaff,
            presentStaff,
            absentStaff,
            lateArrivals: validRecords.filter((record) => record.status === "Late Arrival").length,
            earlyDepartures: validRecords.filter((record) => record.status === "Early Departure").length,
            workFromHome: validRecords.filter((record) => record.status === "Work From Home").length,
            onLeave: validRecords.filter((record) => record.status === "On Leave").length,
            records: validRecords,
        };

        return reportData;
    } catch (error) {
        console.error("❌ Error fetching daily attendance:", error);
        throw new Error("Failed to fetch daily attendance.");
    }
};

/**
 * 📅 Generate & Cache Monthly Attendance Report (AWS S3 + Redis)
 */
const generateMonthlyAttendanceReport = async (month, year) => {
    try {
        const cacheKey = `attendanceReport:${year}-${month}`;
        const cachedReport = await redisClient.get(cacheKey);
        if (cachedReport) {
            return JSON.parse(cachedReport);
        }

        let archivedReport = await ReportArchive.findOne({
            reportType: "Attendance",
            reportMonth: parseInt(month),
            reportYear: parseInt(year),
        });
        if (archivedReport) {
            return { month, year, downloadUrl: archivedReport.fileUrl };
        }

        const startDate = new Date(Date.UTC(year, month - 1, 1));
        const endDate = new Date(Date.UTC(year, month, 0));

        const attendanceRecords = await Attendance.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            {
                $lookup: {
                    from: "users",
                    localField: "staff",
                    foreignField: "_id",
                    as: "staffDetails",
                },
            },
            { $unwind: "$staffDetails" },
            { $match: { "staffDetails.isDeleted": false } }, // Exclude deleted staff
            {
                $group: {
                    _id: "$staffDetails.staffId",
                    name: { $first: "$staffDetails.name" },
                    role: { $first: "$staffDetails.role" },
                    totalPresent: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
                    totalAbsent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
                    lateArrivals: { $sum: { $cond: [{ $eq: ["$status", "Late Arrival"] }, 1, 0] } },
                    earlyDepartures: { $sum: { $cond: [{ $eq: ["$status", "Early Departure"] }, 1, 0] } },
                    workFromHome: { $sum: { $cond: [{ $eq: ["$status", "Work From Home"] }, 1, 0] } },
                    onLeave: { $sum: { $cond: [{ $eq: ["$status", "On Leave"] }, 1, 0] } },
                },
            },
        ]);

        const pdfBuffer = await generateAttendanceReportPDF({ month, year, records: attendanceRecords });
        const fileName = `attendance_report_${year}_${month}.pdf`;
        const pdfUrl = await uploadReportFile(pdfBuffer, fileName, "application/pdf");

        if (!pdfUrl) throw new Error("Failed to upload attendance report to AWS S3");

        archivedReport = await saveReportToArchive("Attendance", month, year, pdfUrl);

        const reportData = { month, year, records: attendanceRecords, downloadUrl: archivedReport.fileUrl };

        await redisClient.setEx(cacheKey, 86400, JSON.stringify(reportData)); // Cache for 1 day

        return reportData;
    } catch (error) {
        console.error("❌ Error generating monthly attendance report:", error);
        throw new Error("Failed to generate monthly attendance report.");
    }
};

/**
 * 📆 Auto-Generate & Cache Yearly Attendance Summary (AWS S3)
 */
const generateYearlyAttendanceSummary = async (year) => {
    try {
        let archivedReport = await ReportArchive.findOne({
            reportType: "Attendance",
            reportMonth: "Yearly",
            reportYear: parseInt(year),
        });
        if (archivedReport) {
            return { year, downloadUrl: archivedReport.fileUrl };
        }

        const startDate = new Date(Date.UTC(year, 0, 1));
        const endDate = new Date(Date.UTC(year, 11, 31));

        const yearlyData = await Attendance.aggregate([
            { $match: { date: { $gte: startDate, $lte: endDate } } },
            {
                $lookup: {
                    from: "users",
                    localField: "staff",
                    foreignField: "_id",
                    as: "staffDetails",
                },
            },
            { $unwind: "$staffDetails" },
            { $match: { "staffDetails.isDeleted": false } }, // Exclude deleted staff
            {
                $group: {
                    _id: "$staffDetails.staffId",
                    name: { $first: "$staffDetails.name" },
                    role: { $first: "$staffDetails.role" },
                    totalPresent: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
                    totalAbsent: { $sum: { $cond: [{ $eq: ["$status", "Absent"] }, 1, 0] } },
                    lateArrivals: { $sum: { $cond: [{ $eq: ["$status", "Late Arrival"] }, 1, 0] } },
                    earlyDepartures: { $sum: { $cond: [{ $eq: ["$status", "Early Departure"] }, 1, 0] } },
                    workFromHome: { $sum: { $cond: [{ $eq: ["$status", "Work From Home"] }, 1, 0] } },
                    onLeave: { $sum: { $cond: [{ $eq: ["$status", "On Leave"] }, 1, 0] } },
                },
            },
        ]);

        const pdfBuffer = await generateAttendanceReportPDF({ year, summary: yearlyData });
        const fileName = `attendance_yearly_report_${year}.pdf`;
        const pdfUrl = await uploadReportFile(pdfBuffer, fileName, "application/pdf");

        archivedReport = await saveReportToArchive("Attendance", "Yearly", year, pdfUrl);

        return { year, summary: yearlyData, downloadUrl: archivedReport.fileUrl };
    } catch (error) {
        console.error("❌ Error generating yearly attendance report:", error);
        throw new Error("Failed to generate yearly attendance report.");
    }
};

/**
 * 📝 Save Report Metadata to MongoDB Archive
 */
const saveReportToArchive = async (reportType, month, year, fileUrl) => {
    return await ReportArchive.create({
        reportType,
        reportMonth: month === "Yearly" ? "Yearly" : parseInt(month),
        reportYear: parseInt(year),
        fileUrl,
    });
};

module.exports = {
    getDailyAttendanceReport,
    generateMonthlyAttendanceReport,
    generateYearlyAttendanceSummary,
};
