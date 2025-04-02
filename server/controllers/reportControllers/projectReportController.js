const projectReportService = require("../../services/reportServices/projectReportService");
const { errorHandler } = require("../../utils/errorHandler"); // ✅ Corrected Import
const ReportArchive = require("../../models/ReportArchive"); // ✅ Report archive model

/**
 * 📍 1. Get Live Project Statistics
 */
const getLiveProjectOverview = async (req, res) => {
    try {
        const stats = await projectReportService.getLiveProjectStats();
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error("❌ Error fetching live project overview:", error);
        return errorHandler(res, error, "Failed to fetch live project overview.");
    }
};

/**
 * 📍 2. Generate Monthly Project Report (PDF & Upload to AWS S3)
 */
const generateMonthlyProjectReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year || isNaN(year) || year < 2000) {
            return res.status(400).json({ success: false, message: "Invalid month or year format." });
        }

        // 🔍 Check if report is already stored in MongoDB archive
        const archivedReport = await ReportArchive.findOne({
            reportType: "Project",
            reportMonth: month,
            reportYear: year
        });

        if (archivedReport) {
            return res.status(200).json({ success: true, downloadUrl: archivedReport.fileUrl });
        }

        // 🆕 Generate the report if not found
        const fileUrl = await projectReportService.generateMonthlyProjectReport(month, year);

        // 📝 Store report metadata in MongoDB
        await saveReportToArchive("Project", month, year, fileUrl);

        return res.status(200).json({ success: true, downloadUrl: fileUrl });
    } catch (error) {
        console.error("❌ Error generating monthly project report:", error);
        return errorHandler(res, error, "Failed to generate monthly project report.");
    }
};

/**
 * 📍 3. Download Existing Monthly Project Report (Fetch from S3)
 */
const downloadMonthlyProjectReport = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year || isNaN(year) || year < 2000) {
            return res.status(400).json({ success: false, message: "Invalid month or year format." });
        }

        // 🔍 Check if the report is archived
        const archivedReport = await ReportArchive.findOne({
            reportType: "Project",
            reportMonth: month,
            reportYear: year
        });

        if (!archivedReport) {
            return res.status(404).json({ success: false, message: "Report not found. Please generate it first." });
        }

        return res.status(200).json({ success: true, downloadUrl: archivedReport.fileUrl });
    } catch (error) {
        console.error("❌ Error downloading monthly project report:", error);
        return errorHandler(res, error, "Failed to download monthly project report.");
    }
};

/**
 * 📍 4. Auto-Delete Expired Reports from AWS S3
 */
const cleanupOldProjectReports = async (req, res) => {
    try {
        await projectReportService.deleteExpiredProjectReports();
        res.status(200).json({ success: true, message: "Old project reports cleaned up from AWS S3." });
    } catch (error) {
        console.error("❌ Error deleting expired project reports:", error);
        return errorHandler(res, error, "Failed to clean up expired project reports.");
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
    getLiveProjectOverview,
    generateMonthlyProjectReport,
    downloadMonthlyProjectReport,
    cleanupOldProjectReports,
};
