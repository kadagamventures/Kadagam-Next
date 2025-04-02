const PDFDocument = require("pdfkit");
const awsService = require("../services/awsService");
const ReportArchive = require("../models/ReportArchive");

/**
 * 📝 Generate a General PDF Report (Tasks, Attendance, Performance) & Upload to AWS S3
 */
const generateReportPDF = async (reportData, title, reportType, month, year) => {
    try {
        // 🔍 Check if the report is already archived
        let archivedReport = await ReportArchive.findOne({ 
            reportType, 
            reportMonth: { $eq: parseInt(month) }, 
            reportYear: { $eq: parseInt(year) }
        });

        if (archivedReport) {
            console.log(`✅ Archived ${reportType} report for ${month}, ${year} already exists.`);
            return archivedReport;
        }

        const doc = new PDFDocument({ margins: { top: 50, left: 50, right: 50, bottom: 50 } });
        const buffers = [];

        doc.on("data", buffers.push.bind(buffers));
        
        // ✅ Ensure Promise-based execution of the PDF generation
        await new Promise((resolve, reject) => {
            doc.on("end", resolve);
            doc.on("error", reject);

            // Title and Summary Section
            doc.fontSize(18).text(title, { align: "center", underline: true }).moveDown();
            addSummarySection(doc, reportData.summary);

            // Data Sections
            if (reportType === "Attendance") {
                addSection(doc, "Attendance Records", reportData.records, ["Date", "Check-In", "Check-Out", "Hours", "Status"]);
            } else if (reportType === "Task") {
                addSection(doc, "Task Completion Records", reportData.tasks, ["Task", "Assigned To", "Priority", "Status", "Updated At"]);
                addSection(doc, "Overdue Tasks", reportData.overdueTasks, ["Task", "Assigned To", "Due Date"]);
            } else if (reportType === "Project") {
                addSection(doc, "Project Overview", reportData.projects, ["Project Name", "Start Date", "End Date", "Status", "Assigned Staff"]);
            } else if (reportType === "Staff") {
                addSection(doc, "Staff Performance", reportData.performance, ["Name", "Email", "Role", "Tasks Completed"]);
            }

            doc.end();
        });

        const pdfBuffer = Buffer.concat(buffers);

        // ✅ Upload PDF to AWS S3
        const fileName = `reports/${reportType}_${year}_${month}.pdf`;
        const fileUrl = await awsService.uploadFile(pdfBuffer, fileName, "application/pdf");

        if (!fileUrl) {
            throw new Error("AWS Upload Failed: No file URL returned.");
        }

        // ✅ Store report metadata in MongoDB
        archivedReport = await saveReportToArchive(reportType, month, year, fileUrl);

        return archivedReport;
    } catch (error) {
        console.error(`❌ Error generating ${reportType} report PDF:`, error);
        throw error;
    }
};

/**
 * ✅ Generate Reports
 */
const generateStaffReportPDF = async (staffReportData, month, year) => generateReportPDF(staffReportData, `Monthly Staff Report - ${month}`, "Staff", month, year);
const generateProjectReportPDF = async (projectReportData, month, year) => generateReportPDF(projectReportData, `Monthly Project Report - ${month}`, "Project", month, year);
const generateAttendanceReportPDF = async (attendanceReportData, month, year) => generateReportPDF(attendanceReportData, `Attendance Report - ${month}`, "Attendance", month, year);
const generateTaskReportPDF = async (taskReportData, month, year) => generateReportPDF(taskReportData, `Task Report - ${month}`, "Task", month, year);

/**
 * ✅ Save Generated Report to MongoDB
 */
const saveReportToArchive = async (reportType, month, year, fileUrl) => {
    try {
        const newReport = new ReportArchive({
            reportType,
            reportMonth: parseInt(month), 
            reportYear: parseInt(year),
            fileUrl
        });
        await newReport.save();

        console.log(`✅ ${reportType} report archived successfully: ${fileUrl}`);
        return newReport;
    } catch (error) {
        console.error(`❌ Error archiving ${reportType} report:`, error);
    }
};

/**
 * 🔹 Helper Functions
 */
function addSummarySection(doc, summary) {
    if (summary) {
        doc.fontSize(14).text("Summary:", { underline: true }).moveDown(0.5);
        Object.entries(summary).forEach(([key, value]) => {
            doc.fontSize(12).text(`${key}: ${value}`);
        });
        doc.moveDown();
    }
}

function addSection(doc, title, data, headers) {
    if (!data || data.length === 0) return;

    doc.fontSize(14).text(title, { underline: true }).moveDown(0.5);
    generateTable(doc, data, headers);
    doc.moveDown();
}

/**
 * 📄 Table Generator with Improved Formatting
 */
function generateTable(doc, data, headers) {
    const startX = doc.x;
    const startY = doc.y;
    const columnWidths = headers.map(() => 100);
    columnWidths[0] = 120;

    doc.font("Helvetica-Bold").fontSize(12);
    headers.forEach((header, i) => {
        doc.text(header, startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0), startY, { width: columnWidths[i], align: "left" });
    });

    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(10);
    data.forEach(row => {
        headers.forEach((header, i) => {
            const key = header.toLowerCase().replace(/\s+/g, "");
            doc.text(row[key] ?? "-", { width: columnWidths[i], align: "left", ellipsis: true });
        });
        doc.moveDown(0.5);
    });
}

module.exports = { generateStaffReportPDF, generateProjectReportPDF, generateAttendanceReportPDF, generateTaskReportPDF };
