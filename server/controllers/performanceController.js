const asyncHandler = require("express-async-handler");
const performanceService = require("../services/performanceService");

/**
 * ✅ Staff: View Own Monthly Performance
 */
const getMyMonthlyPerformance = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  if (!month || !year) {
    return res.status(400).json({ success: false, message: "Month and year are required." });
  }
  const performance = await performanceService.getMonthlyPerformance(req.user.id, year, month);
  res.status(performance ? 200 : 404).json({ success: !!performance, data: performance || "No data found." });
});

/**
 * ✅ Staff: View Own Yearly Performance
 */
const getMyYearlyPerformance = asyncHandler(async (req, res) => {
  const { year } = req.query;
  if (!year) return res.status(400).json({ success: false, message: "Year is required." });

  const performance = await performanceService.getYearlyPerformance(req.user.id, year);
  res.status(performance ? 200 : 404).json({ success: !!performance, data: performance || "No data found." });
});

/**
 * ✅ Admin: View Specific Staff's Monthly Performance
 */
const getMonthlyPerformanceByStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { month, year } = req.query;
  if (!staffId || !month || !year) {
    return res.status(400).json({ success: false, message: "Staff ID, month, and year are required." });
  }

  const performance = await performanceService.getMonthlyPerformance(staffId, year, month);
  res.status(performance ? 200 : 404).json({ success: !!performance, data: performance || "No data found." });
});

/**
 * ✅ Admin: View Specific Staff's Yearly Performance
 */
const getYearlyPerformanceByStaff = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { year } = req.query;
  if (!staffId || !year) {
    return res.status(400).json({ success: false, message: "Staff ID and year are required." });
  }

  const performance = await performanceService.getYearlyPerformance(staffId, year);
  res.status(performance ? 200 : 404).json({ success: !!performance, data: performance || "No data found." });
});

/**
 * ✅ Admin: Fetch Overall Staff Performance Summary (Dashboard)
 */
const getLivePerformanceSummary = asyncHandler(async (req, res) => {
  try {
    const summary = await performanceService.getOverallStaffPerformance();
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error("❌ Error fetching live performance summary:", error);
    res.status(500).json({ success: false, message: "Failed to fetch live performance summary." });
  }
});

/**
 * ✅ Staff / Admin: Fetch Performance Visualization (Charts/Graphs)
 */
const getPerformanceVisualization = asyncHandler(async (req, res) => {
  try {
    const staffId = req.query.staffId || req.user.id;
    if (!staffId) return res.status(400).json({ success: false, message: "Staff ID is required." });

    const data = await performanceService.getStaffVisualizationData(staffId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ Error fetching visualization data:", error);
    res.status(500).json({ success: false, message: "Failed to fetch visualization data." });
  }
});

/**
 * ✅ Admin: Generate Monthly Report (PDF stored in AWS S3 or generated if not found)
 */
const generateMonthlyPerformanceReport = asyncHandler(async (req, res) => {
  const { year, month } = req.query;
  if (!year || !month) {
    return res.status(400).json({ success: false, message: "Year and month are required." });
  }

  try {
    const fileUrl = await performanceService.generateMonthlyStaffReportPDF(year, month);
    res.status(200).json({ success: true, downloadUrl: fileUrl });
  } catch (error) {
    console.error("❌ Error generating report:", error);
    res.status(500).json({ success: false, message: "Failed to generate monthly report." });
  }
});

/**
 * ✅ Staff / Admin: Fetch Detailed Staff Performance By ID (Self or Admin Access)
 */
const getStaffPerformanceById = asyncHandler(async (req, res) => {
  const { staffId } = req.params;

  // ✅ Restrict staff to only view their own data
  if (req.user.role === "staff" && req.user.id !== staffId) {
    return res.status(403).json({ success: false, message: "Unauthorized access" });
  }

  try {
    const data = await performanceService.getStaffPerformanceById(staffId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ Error fetching staff performance:", error);
    res.status(500).json({ success: false, message: "Failed to fetch staff performance." });
  }
});

/**
 * ✅ Staff / Admin: Fetch Detailed Staff Monthly Performance By ID (Self or Admin Access)
 */
const getMonthlyPerformanceById = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { month, year } = req.query;

  if (!staffId || !month || !year) {
    return res.status(400).json({ success: false, message: "Staff ID, month, and year are required." });
  }

  // ✅ Restrict staff to only view their own monthly data
  if (req.user.role === "staff" && req.user.id !== staffId) {
    return res.status(403).json({ success: false, message: "Unauthorized access" });
  }

  try {
    const data = await performanceService.getMonthlyPerformanceById(staffId, year, month);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("❌ Error fetching monthly staff performance:", error);
    res.status(500).json({ success: false, message: "Failed to fetch monthly staff performance." });
  }
});

module.exports = {
  getMyMonthlyPerformance,
  getMyYearlyPerformance,
  getMonthlyPerformanceByStaff,
  getYearlyPerformanceByStaff,
  getLivePerformanceSummary,
  getPerformanceVisualization,
  generateMonthlyPerformanceReport,
  getStaffPerformanceById,
  getMonthlyPerformanceById // ✅ Exported for route use
};
