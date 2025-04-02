const { s3 } = require("../config/awsConfig");
const { v4: uuidv4 } = require("uuid");
const ReportArchive = require("../models/ReportArchive");
const File = require("../models/File");
const Task = require("../models/Task");
const Project = require("../models/Project");

const REPORTS_FOLDER = "reports/";

/**
 * ✅ Upload a staff file (Profile Picture / Resume)
 */
const uploadStaffFile = async (fileBuffer, contentType, options) => {
    const { fileType, staffId } = options;
    const extension = contentType.split("/")[1];

    let fileKey;
    if (fileType === "profilePic") {
        fileKey = `staff-profile-pictures/${staffId}/profile.${extension}`;
    } else if (fileType === "resume") {
        fileKey = `staff-resumes/${staffId}/resume.${extension}`;
    } else {
        throw new Error("Invalid file type for staff upload");
    }

    const uploadResult = await uploadToS3(fileBuffer, fileKey, contentType, fileType === "profilePic");
    console.log(`✅ Staff file uploaded: ${uploadResult}`);
    return uploadResult;
};

/**
 * ✅ Upload a project/task file & store metadata in MongoDB
 */
const uploadProjectTaskFile = async (fileBuffer, fileName, contentType, options) => {
    const { projectId, taskId, uploadedBy } = options;

    if (projectId && !(await Project.findById(projectId))) {
        throw new Error("❌ Invalid project ID");
    }
    if (taskId && !(await Task.findById(taskId))) {
        throw new Error("❌ Invalid task ID");
    }

    const fileKey = `project-files/${projectId || "general"}/${uuidv4()}-${fileName}`;
    const fileUrl = await uploadToS3(fileBuffer, fileKey, contentType, false);

    await File.create({
        fileName,
        fileType: contentType,
        fileSize: fileBuffer.length,
        fileURL: fileUrl,
        uploadedBy,
        project: projectId || null,
        task: taskId || null,
    });

    return fileUrl;
};

/**
 * ✅ Fetch file stream (for preview/download)
 */
const getFileStream = async (key) => {
    if (!key) throw new Error("❌ File key is required to fetch file stream");
    return s3.getObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: key }).createReadStream();
};

/**
 * ✅ Delete a file from S3 & MongoDB
 */
const deleteFile = async (fileKey) => {
    if (!fileKey) throw new Error("❌ File key is required");

    // 🗑 Delete file from MongoDB
    await File.findOneAndDelete({ fileURL: `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}` });

    // 🗑 Delete from S3
    await s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET_NAME, Key: fileKey }).promise();
    console.log(`🗑 File deleted: ${fileKey}`);
};

/**
 * ✅ Upload a report file & store metadata in MongoDB
 */
const uploadReportFile = async (fileBuffer, fileName, contentType) => {
    try {
        const [reportType, year, month] = extractReportMetadata(fileName);

        // 🔍 Check if the report already exists
        const archivedReport = await ReportArchive.findOne({ reportType, reportMonth: month, reportYear: year });
        if (archivedReport) {
            console.log(`✅ ${reportType} report for ${month} ${year} already exists.`);
            return archivedReport.fileUrl;
        }

        const fileKey = `${REPORTS_FOLDER}${uuidv4()}-${fileName}`;
        const uploadResult = await uploadToS3(fileBuffer, fileKey, contentType, false);

        // 📝 Save metadata to MongoDB
        await saveReportToArchive(reportType, month, year, uploadResult);

        return uploadResult;
    } catch (error) {
        console.error("❌ Error uploading report file:", error);
        throw error;
    }
};

/**
 * ✅ Delete old reports from S3 & MongoDB (Older than 1 Year)
 */
const deleteOldReports = async () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    // 🔍 Find expired reports in MongoDB
    const expiredReports = await ReportArchive.find({ reportYear: { $lte: oneYearAgo.getFullYear() } });

    if (expiredReports.length > 0) {
        const fileKeys = expiredReports.map(report => decodeURIComponent(new URL(report.fileUrl).pathname.substring(1)));

        // 🗑 Delete from MongoDB
        await ReportArchive.deleteMany({ _id: { $in: expiredReports.map(report => report._id) } });

        // 🗑 Delete from S3
        if (fileKeys.length > 0) {
            const deleteParams = {
                Bucket: process.env.AWS_S3_BUCKET_NAME,
                Delete: { Objects: fileKeys.map(key => ({ Key: key })) }
            };
            await s3.deleteObjects(deleteParams).promise();
            console.log(`🗑 Deleted ${expiredReports.length} old reports.`);
        }
    }
};

/**
 * ✅ Extracts report metadata from filename
 */
const extractReportMetadata = (fileName) => {
    const regex = /(\w+)-(\d{4})-(\w+)/;
    const match = fileName.match(regex);
    if (!match) throw new Error("Invalid report filename format.");
    return [match[1], match[2], match[3]];
};

/**
 * ✅ Save report metadata to MongoDB
 */
const saveReportToArchive = async (reportType, month, year, fileUrl) => {
    await ReportArchive.create({ reportType, reportMonth: month, reportYear: year, fileUrl });
    console.log(`✅ ${reportType} report archived: ${fileUrl}`);
};

/**
 * ✅ Upload a file to AWS S3
 */
const uploadToS3 = async (buffer, key, contentType, isPublic = false) => {
    const params = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: isPublic ? "public-read" : "private"
    };
    const result = await s3.upload(params).promise();
    return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = {
    uploadStaffFile,
    uploadProjectTaskFile,
    getFileStream,
    deleteFile,
    uploadReportFile,
    deleteOldReports
};
