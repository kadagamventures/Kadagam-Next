const { startOfMonth, endOfMonth, startOfYear, endOfYear, format } = require("date-fns");
const Performance = require("../models/Performance");
const User = require("../models/User");
const pdfService = require("../services/pdfService");
const fileService = require("../services/fileService");
const leaveService = require("../services/leaveService");
const { emitDashboardUpdate } = require("../services/websocketService");

/**
 * 📅 Generate Monthly Performance Reports (Auto-Scheduler - Monthly)
 */
const generateMonthlyPerformanceReports = async (io, month, year) => {
    console.log(`📊 Generating Monthly Performance Reports for ${month}/${year}...`);

    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(startDate);

    const staffList = await User.find({ role: "staff", isDeleted: false }).lean();
    const reports = [];

    for (const staff of staffList) {
        const performance = await Performance.findOne({ staffId: staff._id, month, year }); // ✅ Fixed staffId reference

        if (!performance) {
            console.warn(`⚠️ No performance record found for ${staff.name} in ${month}/${year}`);
            continue;
        }

        const leaveSummary = await leaveService.getLeaveBalance(staff._id); // ✅ Updated leave structure

        const reportData = {
            staffName: staff.name,
            staffEmail: staff.email,
            month: format(startDate, "MMMM yyyy"),
            attendancePercentage: performance.attendancePercentage.toFixed(2) + "%",
            taskCompletionRate: performance.taskCompletionRate.toFixed(2) + "%",
            onTimeCompletionRate: performance.onTimeCompletionRate.toFixed(2) + "%",
            performanceScore: performance.performanceScore.toFixed(2),
            completedTasks: performance.completedTasks,
            leaveSummary: {
                totalLeaveBalance: leaveSummary.totalLeaveBalance, // ✅ Updated field names
                usedLeaves: leaveSummary.usedLeaves,
            },
        };

        reports.push(reportData);
    }

    // ✅ Generate Combined PDF Report for All Staff
    const reportTitle = `Monthly Performance Report - ${format(startDate, "MMMM yyyy")}`;
    const pdfBuffer = await pdfService.generatePerformanceReportPDF(reports, reportTitle);

    // ✅ Upload to S3
    const fileName = `performance-reports/${year}-${month}-monthly-performance-report.pdf`;
    const fileUrl = await fileService.uploadReportFile(pdfBuffer, fileName, "performance-reports/");

    console.log(`✅ Monthly Performance Report uploaded: ${fileUrl}`);

    // ✅ Trigger WebSocket Notification (Fixed io parameter)
    emitDashboardUpdate(io, "performance");

    return { fileUrl };
};

/**
 * 📆 Generate Yearly Performance Reports (Auto-Scheduler - Yearly)
 */
const generateYearlyPerformanceReports = async (io, year) => {
    console.log(`📊 Generating Yearly Performance Reports for ${year}...`);

    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(startDate);

    const staffList = await User.find({ role: "staff", isDeleted: false }).lean();
    const reports = [];

    for (const staff of staffList) {
        const performance = await Performance.findOne({ staffId: staff._id, year, isYearly: true }); // ✅ Fixed staffId reference

        if (!performance) {
            console.warn(`⚠️ No yearly performance record found for ${staff.name} in ${year}`);
            continue;
        }

        const leaveSummary = await leaveService.getLeaveBalance(staff._id); // ✅ Updated leave structure

        const reportData = {
            staffName: staff.name,
            staffEmail: staff.email,
            year: year,
            attendancePercentage: performance.attendancePercentage.toFixed(2) + "%",
            taskCompletionRate: performance.taskCompletionRate.toFixed(2) + "%",
            onTimeCompletionRate: performance.onTimeCompletionRate.toFixed(2) + "%",
            performanceScore: performance.performanceScore.toFixed(2),
            completedTasks: performance.completedTasks,
            leaveSummary: {
                totalLeaveBalance: leaveSummary.totalLeaveBalance, // ✅ Updated field names
                usedLeaves: leaveSummary.usedLeaves,
            },
        };

        reports.push(reportData);
    }

    // ✅ Generate Combined PDF Report for All Staff
    const reportTitle = `Yearly Performance Report - ${year}`;
    const pdfBuffer = await pdfService.generatePerformanceReportPDF(reports, reportTitle);

    // ✅ Upload to S3
    const fileName = `performance-reports/${year}-yearly-performance-report.pdf`;
    const fileUrl = await fileService.uploadReportFile(pdfBuffer, fileName, "performance-reports/");

    console.log(`✅ Yearly Performance Report uploaded: ${fileUrl}`);

    // ✅ Trigger WebSocket Notification (Fixed io parameter)
    emitDashboardUpdate(io, "performance");

    return { fileUrl };
};

module.exports = {
    generateMonthlyPerformanceReports,
    generateYearlyPerformanceReports,
};
