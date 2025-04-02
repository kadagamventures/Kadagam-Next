const adminDashboardService = require("../services/adminDashboardService");

/**
 * ✅ Fetch Dashboard Overview (Total Projects, Staff, Ongoing & Completed Tasks)
 */
const getDashboardOverview = async (req, res) => {
  try {
    const overviewData = await adminDashboardService.getOverviewData();
    res.status(200).json(overviewData);
  } catch (error) {
    console.error("Error fetching dashboard overview:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

/**
 * ✅ Fetch Data for Visualization (Bar Chart & Pie Chart)
 */
const getDashboardCharts = async (req, res) => {
  try {
    const chartData = await adminDashboardService.getChartData();
    res.status(200).json(chartData);
  } catch (error) {
    console.error("Error fetching dashboard chart data:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { getDashboardOverview, getDashboardCharts };
