const moment = require("moment");
const redisClient = require("../../config/redisConfig"); // ✅ Redis for caching
const attendanceReportService = require("../../services/reportServices/attendanceReportService");
const taskReportService = require("../../services/reportServices/taskReportService");
const performanceService = require("../../services/performanceService");
const projectService = require("../../services/projectService");
const awsService = require("../../services/awsService");

const CACHE_EXPIRATION = 60 * 5; // ✅ Cache expiration: 5 minutes

// ===================== 👤 STAFF SELF-PERFORMANCE REPORTS ===================== \\

/**
 * ✅ Fetch Monthly Performance Report (For Logged-in Staff)
 */
exports.getSelfMonthlyPerformance = async (req, res) => {
    try {
        const { year, month } = req.query;
        const staffId = req.user.id;

        if (!year || !month) {
            return res.status(400).json({ message: "Year and Month are required." });
        }

        const cacheKey = `monthlyReport:${staffId}:${year}:${month}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const attendanceSummary = await attendanceReportService.getMonthlyAttendanceSummary(staffId, year, month);
        const taskSummary = await taskReportService.getMonthlyTaskSummary(staffId, year, month);
        const projectInvolvement = await projectService.getProjectInvolvementForStaff(staffId, year, month);

        const performanceScore = performanceService.calculatePerformanceScore({
            attendancePercentage: attendanceSummary.attendancePercentage,
            totalTasks: taskSummary.totalTasks,
            completedTasks: taskSummary.completedTasks,
            taskComplexitySummary: taskSummary.taskComplexitySummary
        });

        const reportData = {
            year, month,
            attendanceSummary,
            taskSummary,
            projectInvolvement,
            totalLeaves: attendanceSummary.totalLeaves,
            performanceScore
        };

        await redisClient.set(cacheKey, JSON.stringify(reportData), "EX", CACHE_EXPIRATION);

        return res.status(200).json(reportData);
    } catch (error) {
        console.error("❌ Error fetching monthly report:", error);
        return res.status(500).json({ message: "Failed to fetch monthly report.", error: error.message });
    }
};

/**
 * ✅ Fetch Yearly Performance Report (For Logged-in Staff)
 */
exports.getSelfYearlyPerformance = async (req, res) => {
    try {
        const { year } = req.query;
        const staffId = req.user.id;

        if (!year) {
            return res.status(400).json({ message: "Year is required." });
        }

        const cacheKey = `yearlyReport:${staffId}:${year}`;
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        const attendanceSummary = await attendanceReportService.getYearlyAttendanceSummary(staffId, year);
        const taskSummary = await taskReportService.getYearlyTaskSummary(staffId, year);
        const projectInvolvement = await projectService.getYearlyProjectInvolvement(staffId, year);

        const performanceScore = performanceService.calculatePerformanceScore({
            attendancePercentage: attendanceSummary.attendancePercentage,
            totalTasks: taskSummary.totalTasks,
            completedTasks: taskSummary.completedTasks,
            taskComplexitySummary: taskSummary.taskComplexitySummary
        });

        const reportData = {
            year,
            attendanceSummary,
            taskSummary,
            projectInvolvement,
            totalLeaves: attendanceSummary.totalLeaves,
            performanceScore
        };

        await redisClient.set(cacheKey, JSON.stringify(reportData), "EX", CACHE_EXPIRATION);

        return res.status(200).json(reportData);
    } catch (error) {
        console.error("❌ Error fetching yearly report:", error);
        return res.status(500).json({ message: "Failed to fetch yearly report.", error: error.message });
    }
};

// ===================== 🏢 ADMIN DASHBOARD REPORTS ===================== \\

/**
 * ✅ Fetch Overall Staff Performance Overview (For Admin Dashboard)
 */
exports.getStaffPerformanceOverview = async (req, res) => {
    try {
        const overviewData = await performanceService.getOverallStaffPerformance();
        return res.status(200).json({ success: true, data: overviewData });
    } catch (error) {
        console.error("❌ Error fetching staff performance overview:", error);
        return res.status(500).json({ message: "Failed to fetch staff performance overview.", error: error.message });
    }
};

/**
 * ✅ Fetch Individual Staff Performance (Admin Search by staffId)
 */
exports.getSpecificStaffPerformance = async (req, res) => {
    try {
        const { staffId } = req.params;

        if (!staffId) {
            return res.status(400).json({ message: "Staff ID is required." });
        }

        const staffPerformance = await performanceService.getStaffPerformanceById(staffId);

        return res.status(200).json({ success: true, data: staffPerformance });
    } catch (error) {
        console.error("❌ Error fetching staff performance:", error);
        return res.status(500).json({ message: "Failed to fetch staff performance.", error: error.message });
    }
};

/**
 * ✅ Download Monthly Staff Report (Admin Access)
 */
exports.downloadStaffMonthlyReport = async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month) {
            return res.status(400).json({ message: "Year and Month are required." });
        }

        const fileUrl = await performanceService.generateMonthlyStaffReportPDF(year, month);

        return res.status(200).json({ success: true, downloadUrl: fileUrl });
    } catch (error) {
        console.error("❌ Error generating monthly staff report:", error);
        return res.status(500).json({ message: "Failed to generate monthly staff report.", error: error.message });
    }
};

// ===================== 📊 DATA VISUALIZATION ===================== \\

/**
 * ✅ Fetch Data Visualization for All Staff (Admin Dashboard Charts)
 */
exports.getStaffVisualizationData = async (req, res) => {
    try {
        const visualizationData = await performanceService.getStaffVisualizationData();
        return res.status(200).json({ success: true, data: visualizationData });
    } catch (error) {
        console.error("❌ Error fetching staff visualization data:", error);
        return res.status(500).json({ message: "Failed to fetch staff visualization data.", error: error.message });
    }
};

/**
 * ✅ Fetch Data Visualization for Individual Staff (Self Dashboard)
 */
exports.getSelfVisualizationData = async (req, res) => {
    try {
        const staffId = req.user.id;
        const visualizationData = await performanceService.getStaffVisualizationData(staffId);
        return res.status(200).json({ success: true, data: visualizationData });
    } catch (error) {
        console.error("❌ Error fetching self visualization data:", error);
        return res.status(500).json({ message: "Failed to fetch self visualization data.", error: error.message });
    }
};
