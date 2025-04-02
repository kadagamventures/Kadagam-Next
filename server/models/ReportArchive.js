const mongoose = require("mongoose");

const ReportArchiveSchema = new mongoose.Schema(
    {
        reportType: {
            type: String,
            enum: ["Attendance", "Task", "Project", "Staff", "Overview"],
            required: true,
        },
        reportMonth: {
            type: String, // Format: "YYYY-MM" (e.g., "2025-02")
            required: true,
        },
        reportYear: {
            type: Number,
            required: true,
        },
        fileUrl: {
            type: String, // AWS S3 link
            required: true,
        },
        generatedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// ✅ Indexing for faster queries
ReportArchiveSchema.index({ reportType: 1, reportYear: 1, reportMonth: 1 });

module.exports = mongoose.model("ReportArchive", ReportArchiveSchema);
