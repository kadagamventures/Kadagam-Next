const pdfService = require("./pdfService");
const awsService = require("./awsService");
const attendanceReportService = require("./reportServices/attendanceReportService");
const taskReportService = require("./reportServices/taskReportService");
const projectReportService = require("./reportServices/projectReportService");
const staffReportService = require("./reportServices/staffReportService");
const overviewReportService = require("./reportServices/overviewReportService");
const ReportArchive = require("../models/ReportArchive"); // ✅ Report archive model

/**
 * Generates a report dynamically, uploads it to AWS S3, and stores metadata in MongoDB.
 * @param {String} type - The type of report (overview, attendance, task, etc.).
 * @param {Object} params - Parameters required for report generation.
 * @returns {Object} - Contains the download URL of the generated report.
 */
const generateReport = async (type, params) => {
    try {
        let reportData;

        // Select the correct report service
        switch (type) {
            case "overview":
                reportData = await overviewReportService.generate(params);
                break;
            case "attendance":
                reportData = await attendanceReportService.generate(params);
                break;
            case "task":
                reportData = await taskReportService.generate(params);
                break;
            case "project":
                reportData = await projectReportService.generate(params);
                break;
            case "staff":
                reportData = await staffReportService.generate(params);
                break;
            default:
                throw new Error("Invalid report type.");
        }

        if (!reportData) {
            throw new Error(`Failed to generate ${type} report.`);
        }

        // Extract month and year from params
        const year = params.year || new Date().getFullYear();
        const month = params.month || "Yearly"; // Default to "Yearly" if month is not specified

        // 🔍 Check if the report is already archived
        const archivedReport = await ReportArchive.findOne({ reportType: type, reportMonth: month, reportYear: year });

        if (archivedReport) {
            console.log(`✅ Archived ${type} report for ${month}, ${year} already exists.`);
            return { downloadUrl: archivedReport.fileUrl };
        }

        // Generate PDF file from report data
        const pdfBuffer = await pdfService.createPDF(reportData);

        // Upload PDF to AWS S3 with 1-year retention
        const fileName = `reports/${type}_${year}_${month}.pdf`;
        const uploadResult = await awsService.uploadFile(pdfBuffer, fileName, { expiresIn: "1y" });

        // 📝 Store report metadata in MongoDB
        await saveReportToArchive(type, month, year, uploadResult.url);

        // Return only the download link
        return { downloadUrl: uploadResult.url };
    } catch (error) {
        console.error("❌ Error generating report:", error);
        throw new Error("Report generation failed.");
    }
};

/**
 * Generates yearly reports automatically at year-end, uploads them to AWS S3, and stores metadata.
 */
const generateYearlyReports = async () => {
    try {
        const reportTypes = ["attendance", "task", "project", "staff"];
        const year = new Date().getFullYear();

        for (const type of reportTypes) {
            const params = { year };
            console.log(`Generating yearly ${type} report for ${year}...`);
            await generateReport(type, params);
        }

        console.log("✅ Yearly reports successfully generated and uploaded to AWS S3.");
    } catch (error) {
        console.error("❌ Error generating yearly reports:", error);
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

module.exports = { generateReport, generateYearlyReports };
