const leaveReportService = require("../../services/reportServices/leaveReportService");

/**
 * ✅ API: Fetch Monthly Leave Report
 */
exports.getMonthlyLeaveReport = async (req, res) => {
    try {
        const { year, month } = req.params;
        const report = await leaveReportService.getMonthlyLeaveReport(year, month);
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ✅ API: Fetch Yearly Leave Report
 */
exports.getYearlyLeaveReport = async (req, res) => {
    try {
        const { year } = req.params;
        const report = await leaveReportService.getYearlyLeaveReport(year);
        res.status(200).json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ✅ API: Generate Yearly Leave Report PDF & Upload
 */
exports.generateYearlyLeaveReport = async (req, res) => {
    try {
        const { year } = req.params;
        const fileUrl = await leaveReportService.generateYearlyLeaveReportFile(year);
        res.status(201).json({ message: "Report generated", fileUrl });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * ✅ API: Cleanup Old Leave Reports
 */
exports.cleanupOldLeaveReports = async (req, res) => {
    try {
        const result = await leaveReportService.cleanupOldLeaveReports();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
