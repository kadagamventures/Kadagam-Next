const Leave = require("../../models/Leave");
const ReportArchive = require("../../models/ReportArchive");
const pdfService = require("../../services/pdfService");
const awsService = require("../../services/awsService");

const leaveReportService = {
    /**
     * ✅ Fetch Monthly Leave Report (Includes Approved & Rejected)
     */
    async getMonthlyLeaveReport(year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of the month

        return await Leave.aggregate([
            {
                $match: {
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate },
                    status: { $in: ["approved", "rejected"] },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "staff",
                    foreignField: "_id",
                    as: "staffDetails",
                },
            },
            { $unwind: "$staffDetails" },
            {
                $project: {
                    staffName: "$staffDetails.name",
                    email: "$staffDetails.email",
                    startDate: 1,
                    endDate: 1,
                    status: 1,
                    reason: 1,
                },
            },
        ]);
    },

    /**
     * ✅ Fetch Yearly Leave Report (Includes Approved & Rejected)
     */
    async getYearlyLeaveReport(year) {
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);

        return await Leave.aggregate([
            {
                $match: {
                    startDate: { $lte: endDate },
                    endDate: { $gte: startDate },
                    status: { $in: ["approved", "rejected"] },
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "staff",
                    foreignField: "_id",
                    as: "staffDetails",
                },
            },
            { $unwind: "$staffDetails" },
            {
                $project: {
                    staffName: "$staffDetails.name",
                    email: "$staffDetails.email",
                    startDate: 1,
                    endDate: 1,
                    status: 1,
                    reason: 1,
                },
            },
        ]);
    },

    /**
     * ✅ Generate Yearly Leave Report PDF & Upload to AWS S3
     */
    async generateYearlyLeaveReportFile(year) {
        // 🔍 Check if the report is already archived
        const archivedReport = await ReportArchive.findOne({
            reportType: "Leave",
            reportMonth: "Yearly",
            reportYear: year,
        });

        if (archivedReport) {
            console.log(`✅ Yearly leave report for ${year} already exists.`);
            return archivedReport.fileUrl;
        }

        const reportData = await this.getYearlyLeaveReport(year);
        if (!reportData.length) throw new Error("No leave records found for this year.");

        // ✅ Generate PDF
        const pdfBuffer = await pdfService.generateLeaveReportPDF(reportData, year);
        const fileName = `leave-reports/${year}-leave-report.pdf`;

        // ✅ Upload to AWS S3
        const fileUrl = await awsService.uploadReportFile(pdfBuffer, fileName, { expiresIn: "1y" });

        // ✅ Store report metadata in MongoDB
        await saveReportToArchive("Leave", "Yearly", year, fileUrl);

        return fileUrl;
    },

    /**
     * ✅ Auto-Delete Leave Reports Older Than 1 Year
     */
    async cleanupOldLeaveReports() {
        const oneYearAgo = new Date().getFullYear() - 1;
        const oldReportKey = `leave-reports/${oneYearAgo}-leave-report.pdf`;

        // ✅ Check if file exists in S3
        const fileExists = await awsService.fileExists(oldReportKey);
        if (!fileExists) return { message: "No old leave reports found for deletion." };

        // ✅ Delete file from S3
        await awsService.deleteFile(oldReportKey);

        // 🗑 Remove record from ReportArchive
        await ReportArchive.deleteOne({ reportType: "Leave", reportMonth: "Yearly", reportYear: oneYearAgo });

        return { message: `Old leave report (${oneYearAgo}) deleted successfully.` };
    },
};

/**
 * 🆕 Save Generated Report to Archive
 */
const saveReportToArchive = async (reportType, month, year, fileUrl) => {
    try {
        const newReport = new ReportArchive({
            reportType,
            reportMonth: month,
            reportYear: year,
            fileUrl,
        });
        await newReport.save();

        console.log(`✅ ${reportType} report archived successfully: ${fileUrl}`);
    } catch (error) {
        console.error(`❌ Error archiving ${reportType} report:`, error);
    }
};

module.exports = leaveReportService;
