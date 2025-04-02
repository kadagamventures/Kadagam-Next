const asyncHandler = require("express-async-handler");
const taskReportService = require("../../services/reportServices/taskReportService");
const awsService = require("../../services/awsService"); // ✅ AWS S3 for Report Retrieval
const ReportArchive = require("../../models/ReportArchive"); // ✅ Report archive model

/**
 * 📍 1. Generate Task Report (Admin Only)
 */
const generateTaskReport = asyncHandler(async (req, res) => {
  const { reportType, month, year } = req.query;

  if (!reportType || !["daily", "monthly", "yearly"].includes(reportType)) {
    return res.status(400).json({ message: "Invalid report type. Choose daily, monthly, or yearly." });
  }

  if (!month || !year) {
    return res.status(400).json({ message: "Month and year are required." });
  }

  // 🔼 Generate the PDF report
  const reportUrl = await taskReportService.generateTaskReport(reportType, month, year);

  // 📝 Store the report metadata in MongoDB
  await saveReportToArchive("Task", month, year, reportUrl);

  res.status(200).json({ success: true, message: "Task report generated successfully", reportUrl });
});

/**
 * 📍 2. Download Archived Task Report (Admin Only)
 */
const downloadArchivedTaskReport = asyncHandler(async (req, res) => {
  const { month, year, reportType } = req.query;

  if (!reportType || !["daily", "monthly", "yearly"].includes(reportType)) {
    return res.status(400).json({ message: "Invalid report type." });
  }

  if (!month || !year) {
    return res.status(400).json({ message: "Month and year are required." });
  }

  // 🔍 Find the report in the archive collection
  const archivedReport = await ReportArchive.findOne({ reportType: "Task", reportMonth: month, reportYear: year });

  if (!archivedReport) {
    return res.status(404).json({ message: "Archived report not found for this period." });
  }

  res.status(200).json({ success: true, fileUrl: archivedReport.fileUrl });
});

/**
 * 📍 3. Fetch Real-time Task Statistics (Admin Only)
 */
const getLiveTaskStats = asyncHandler(async (req, res) => {
  const stats = await taskReportService.getLiveTaskStats();
  res.status(200).json({ success: true, stats });
});

/**
 * 📍 4. Fetch Data Visualization (Admin Only)
 */
const getTaskVisualizationData = asyncHandler(async (req, res) => {
  const data = await taskReportService.getTaskVisualizationData();
  res.status(200).json({ success: true, data });
});

/**
 * 📍 5. Fetch Self Task Report (For Staff)
 */
const getSelfTaskReport = asyncHandler(async (req, res) => {
  const staffId = req.user.id;
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ message: "Year and Month are required." });
  }

  try {
    const taskSummary = await taskReportService.getMonthlyTaskSummary(staffId, year, month);

    res.status(200).json({
      success: true,
      year,
      month,
      taskSummary
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task report.", error: error.message });
  }
});

/**
 * 🆕 Save Generated Report to AWS S3 & Store Metadata in MongoDB
 */
const saveReportToArchive = async (reportType, month, year, fileUrl) => {
  try {
    await ReportArchive.updateOne(
      { reportType, reportMonth: month, reportYear: year },
      { fileUrl },
      { upsert: true }
    );

    console.log(`✅ ${reportType} report archived successfully: ${fileUrl}`);
  } catch (error) {
    console.error(`❌ Error archiving ${reportType} report:`, error);
  }
};

module.exports = {
  generateTaskReport,
  downloadArchivedTaskReport,
  getLiveTaskStats,
  getTaskVisualizationData,
  getSelfTaskReport // ✅ Staff can view only their own reports
};
