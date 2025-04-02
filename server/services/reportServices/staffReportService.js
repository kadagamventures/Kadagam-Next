const Task = require("../../models/Task");
const Attendance = require("../../models/Attendance");
const Leave = require("../../models/Leave");
const User = require("../../models/User");
const redisClient = require("../../config/redisConfig"); // ✅ Redis for caching
const pdfService = require("../../services/pdfService"); // ✅ PDF generation
const awsService = require("../../services/awsService"); // ✅ AWS S3 storage
const ReportArchive = require("../../models/ReportArchive"); // ✅ Report archive model

const CACHE_EXPIRATION = 60 * 5; // ✅ 5-minute cache expiration

// ===================== 📌 PERFORMANCE CALCULATION ===================== \\

/**
 * ✅ Calculate combined performance score for staff
 * - 50% Attendance
 * - 30% Task Completion
 * - 20% Project/Task Complexity Involvement
 */
const calculatePerformanceScore = ({ attendancePercentage, totalTasks, completedTasks, taskComplexitySummary }) => {
    const attendanceScore = attendancePercentage * 0.5;
    const taskCompletionScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 * 0.3 : 100 * 0.3;

    const complexityWeight = (
        (taskComplexitySummary.high * 3) +
        (taskComplexitySummary.medium * 2) +
        (taskComplexitySummary.low * 1)
    ) / Math.max(totalTasks, 1); // ✅ Prevent division by zero

    const projectComplexityScore = (complexityWeight / 3) * 20; // ✅ Max 20% contribution

    return parseFloat((attendanceScore + taskCompletionScore + projectComplexityScore).toFixed(2));
};

// ===================== 📌 STAFF PERFORMANCE REPORTS ===================== \\

/**
 * ✅ Fetch Monthly Performance Summary for Staff (Includes Leave Summary)
 */
const getMonthlyPerformance = async (staffId, year, month) => {
    const cacheKey = `monthlyPerformance:${staffId}:${year}:${month}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) return JSON.parse(cachedData);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendance = await Attendance.find({ staff: staffId, date: { $gte: startDate, $lte: endDate } });
    const tasks = await Task.find({ assignedTo: staffId, createdAt: { $gte: startDate, $lte: endDate } }).lean();
    const leaves = await Leave.countDocuments({ staff: staffId, startDate: { $lte: endDate }, endDate: { $gte: startDate } });

    const attendancePercentage = attendance.length > 0
        ? (attendance.filter(a => a.status === "Present").length / attendance.length) * 100
        : 0;

    const completedTasks = tasks.filter(t => t.status === "Completed").length;
    const totalTasks = tasks.length;

    const onTimeCompletionRate = completedTasks > 0
        ? (tasks.filter(t => t.completedAt && t.completedAt <= t.dueDate).length / completedTasks) * 100
        : 0;

    const taskComplexitySummary = {
        high: tasks.filter(t => t.priority === "High").length,
        medium: tasks.filter(t => t.priority === "Medium").length,
        low: tasks.filter(t => t.priority === "Low").length,
    };

    const performanceScore = calculatePerformanceScore({
        attendancePercentage,
        totalTasks,
        completedTasks,
        taskComplexitySummary
    });

    const result = {
        attendancePercentage: attendancePercentage.toFixed(2),
        onTimeCompletionRate: onTimeCompletionRate.toFixed(2),
        totalTasks,
        completedTasks,
        totalLeaves: leaves,
        performanceScore
    };

    // ✅ Cache the result in Redis for faster access
    await redisClient.set(cacheKey, JSON.stringify(result), "EX", CACHE_EXPIRATION);

    return result;
};

/**
 * ✅ Fetch Yearly Performance Summary for Staff (Includes Leave Summary)
 */
const getYearlyPerformance = async (staffId, year) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const attendance = await Attendance.find({ staff: staffId, date: { $gte: startDate, $lte: endDate } });
    const tasks = await Task.find({ assignedTo: staffId, createdAt: { $gte: startDate, $lte: endDate } }).lean();
    const leaves = await Leave.countDocuments({ staff: staffId, startDate: { $lte: endDate }, endDate: { $gte: startDate } });

    const attendancePercentage = attendance.length > 0
        ? (attendance.filter(a => a.status === "Present").length / attendance.length) * 100
        : 0;

    const completedTasks = tasks.filter(t => t.status === "Completed").length;
    const totalTasks = tasks.length;

    const onTimeCompletionRate = completedTasks > 0
        ? (tasks.filter(t => t.completedAt && t.completedAt <= t.dueDate).length / completedTasks) * 100
        : 0;

    const taskComplexitySummary = {
        high: tasks.filter(t => t.priority === "High").length,
        medium: tasks.filter(t => t.priority === "Medium").length,
        low: tasks.filter(t => t.priority === "Low").length,
    };

    const performanceScore = calculatePerformanceScore({
        attendancePercentage,
        totalTasks,
        completedTasks,
        taskComplexitySummary
    });

    return {
        attendancePercentage: attendancePercentage.toFixed(2),
        onTimeCompletionRate: onTimeCompletionRate.toFixed(2),
        totalTasks,
        completedTasks,
        totalLeaves: leaves,
        performanceScore
    };
};

// ===================== 📊 DATA VISUALIZATION ===================== \\

/**
 * ✅ Fetch Data Visualization for All Staff Based on Role (Admin Dashboard Charts)
 */
const getStaffVisualizationData = async (role) => {
    try {
        const query = { isActive: true }; // ✅ Ensure only active users are fetched

        if (role) {
            query.role = role; // ✅ Dynamically filter staff by role
        }

        const staffList = await User.find(query).lean();
        return staffList;
    } catch (error) {
        console.error("❌ Error fetching staff visualization data:", error);
        return [];
    }
};

/**
 * ✅ Fetch Data Visualization for Individual Staff (Self Dashboard)
 */
const getSelfVisualizationData = async (staffId) => {
    try {
        const staffData = await User.findById(staffId).lean();
        return staffData;
    } catch (error) {
        console.error("❌ Error fetching self visualization data:", error);
        return null;
    }
};

// ===================== 📥 REPORT PDF GENERATION ===================== \\

/**
 * ✅ Generate & Store Monthly Staff Report (PDF Upload to AWS S3)
 */
const generateMonthlyStaffReportPDF = async (year, month) => {
    const reportData = await getStaffVisualizationData();

    const pdfBuffer = await pdfService.generateStaffReportPDF(reportData, `Staff Report - ${month}/${year}`);

    const fileName = `reports/staff/${year}/${month}/staff-report.pdf`;
    const fileUrl = await awsService.uploadFile(pdfBuffer, fileName, { expiresIn: "1y" });

    return fileUrl;
};

module.exports = {
    calculatePerformanceScore,
    getMonthlyPerformance,
    getYearlyPerformance,
    getStaffVisualizationData,
    getSelfVisualizationData,
    generateMonthlyStaffReportPDF
};
