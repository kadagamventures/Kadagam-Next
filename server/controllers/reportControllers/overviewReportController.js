const overviewReportService = require("../../services/reportServices/overviewReportService");

/**
 * 📊 Get Overall Report (Supports Date Filtering)
 */
const getOverviewReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        // 🔍 Validate date inputs
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({ success: false, message: "Invalid date range." });
        }

        const overviewData = await overviewReportService.getOverviewData(startDate, endDate);

        return res.status(200).json({ success: true, data: overviewData });
    } catch (error) {
        next(error); // ✅ Correct error handling
    }
};

/**
 * 📈 Get Dashboard Charts (Supports Date Filtering)
 */
const getOverviewCharts = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const chartData = await overviewReportService.getChartData(startDate, endDate);
        return res.status(200).json({ success: true, data: chartData });
    } catch (error) {
        next(error); // ✅ Correct error handling
    }
};

module.exports = {
    getOverviewReport,
    getOverviewCharts
};
