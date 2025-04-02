const attendanceReportService = require("../../services/reportServices/attendanceReportService");
const { errorHandler } = require("../../utils/errorHandler");
const awsService = require("../../services/awsService");
const ReportArchive = require("../../models/ReportArchive");
const moment = require("moment");

/**
 * 📆 Get Daily Attendance Report (Live Data)
 * ✅ Restricted to Admins Only
 */
const getDailyAttendanceReport = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date || !moment(date, "YYYY-MM-DD", true).isValid()) {
            return res.status(400).json({ success: false, message: "Invalid date format. Use YYYY-MM-DD." });
        }

        const attendanceData = await attendanceReportService.getDailyAttendanceReport(date);
        return res.status(200).json({ success: true, data: attendanceData });
    } catch (error) {
        console.error("❌ Error fetching daily attendance report:", error);
        return errorHandler(res, error, "Failed to fetch daily attendance report.");
    }
};

/**
 * 📅 Get Monthly Attendance Report (On-Demand)
 */
const getMonthlyAttendanceReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ success: false, message: "Invalid month. Provide a value between 1 and 12." });
        }
        if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
            return res.status(400).json({ success: false, message: "Invalid year. Provide a valid year." });
        }

        const reportData = await attendanceReportService.generateMonthlyAttendanceReport(month, year);
        return res.status(200).json({ success: true, data: reportData });
    } catch (error) {
        console.error("❌ Error fetching monthly attendance report:", error);
        return errorHandler(res, error, "Failed to fetch monthly attendance report.");
    }
};

/**
 * 🖨 Download Monthly Attendance Report (Stored in AWS S3)
 * ✅ Generates report if not already stored in MongoDB archive
 */
const downloadMonthlyAttendancePDF = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || isNaN(month) || month < 1 || month > 12) {
            return res.status(400).json({ success: false, message: "Invalid month. Provide a value between 1 and 12." });
        }
        if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
            return res.status(400).json({ success: false, message: "Invalid year. Provide a valid year." });
        }

        const archivedReport = await ReportArchive.findOne({
            reportType: "Attendance",
            reportMonth: month,
            reportYear: year
        });

        if (archivedReport) {
            return res.status(200).json({ success: true, downloadUrl: archivedReport.fileUrl });
        }

        const reportData = await attendanceReportService.generateMonthlyAttendanceReport(month, year);
        const fileUrl = await awsService.uploadReportToS3(reportData, `attendance_reports/${year}/${month}-attendance-report.pdf`);

        if (!fileUrl) {
            throw new Error("Failed to upload the report to AWS S3.");
        }

        await saveReportToArchive("Attendance", month, year, fileUrl);

        return res.status(200).json({ success: true, downloadUrl: fileUrl });
    } catch (error) {
        console.error("❌ Error generating monthly attendance report PDF:", error);
        return errorHandler(res, error, "Failed to generate monthly attendance report.");
    }
};

/**
 * 📆 Get Yearly Attendance Summary (Auto-Generated)
 */
const getYearlyAttendanceSummary = async (req, res) => {
    try {
        const { year } = req.query;

        if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
            return res.status(400).json({ success: false, message: "Invalid year. Provide a valid year." });
        }

        const summaryData = await attendanceReportService.generateYearlyAttendanceSummary(year);
        return res.status(200).json({ success: true, data: summaryData });
    } catch (error) {
        console.error("❌ Error fetching yearly attendance summary:", error);
        return errorHandler(res, error, "Failed to fetch yearly attendance summary.");
    }
};

/**
 * 🖨 Download Yearly Attendance Report (Stored in AWS S3 for 1 Year)
 * ✅ Generates report only if not already stored
 */
const downloadYearlyAttendancePDF = async (req, res) => {
    try {
        const { year } = req.query;

        if (!year || isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
            return res.status(400).json({ success: false, message: "Invalid year. Provide a valid year." });
        }

        const archivedReport = await ReportArchive.findOne({
            reportType: "Attendance",
            reportMonth: "Yearly",
            reportYear: year
        });

        if (archivedReport) {
            return res.status(200).json({ success: true, downloadUrl: archivedReport.fileUrl });
        }

        const summaryData = await attendanceReportService.generateYearlyAttendanceSummary(year);
        const fileUrl = await awsService.uploadReportToS3(summaryData, `attendance_reports/${year}-yearly-attendance.pdf`);

        if (!fileUrl) {
            throw new Error("Failed to upload the report to AWS S3.");
        }

        await saveReportToArchive("Attendance", "Yearly", year, fileUrl);

        return res.status(200).json({ success: true, downloadUrl: fileUrl });
    } catch (error) {
        console.error("❌ Error generating yearly attendance report PDF:", error);
        return errorHandler(res, error, "Failed to generate yearly attendance report.");
    }
};

/**
 * 🆕 Save Generated Report to AWS S3 & Store Metadata in MongoDB
 */
const saveReportToArchive = async (reportType, month, year, fileUrl) => {
    try {
        const newReport = new ReportArchive({
            reportType,
            reportMonth: month,
            reportYear: year,
            fileUrl
        });
        await newReport.save();
        console.log(`✅ ${reportType} report archived successfully: ${fileUrl}`);
    } catch (error) {
        console.error(`❌ Error archiving ${reportType} report:`, error);
    }
};

module.exports = {
    getDailyAttendanceReport,
    getMonthlyAttendanceReport,
    downloadMonthlyAttendancePDF,
    getYearlyAttendanceSummary,
    downloadYearlyAttendancePDF
};
