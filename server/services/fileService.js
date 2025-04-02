const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const File = require("../models/File");
const Task = require("../models/Task");
const Project = require("../models/Project");
require("dotenv").config();

// ✅ Initialize S3 client
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
if (!BUCKET_NAME) throw new Error("❌ AWS_S3_BUCKET_NAME is missing in .env file!");

// ✅ Allowed file types
const allowedTypes = {
    profile: ["image/jpeg", "image/png"],
    resume: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    report: ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    projectFiles: ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "image/png", "image/jpeg"]
};

// ✅ Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // ✅ Ensure AWS allows this size
    fileFilter: (req, file, cb) => {
        if (
            [...allowedTypes.profile, ...allowedTypes.resume, ...allowedTypes.report, ...allowedTypes.projectFiles].includes(file.mimetype)
        ) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Allowed: JPEG, PNG, PDF, DOC, DOCX, XLSX"), false);
        }
    }
});

/**
 * ✅ Upload a file to S3
 */
const uploadFile = async (file, { fileType, staffId, projectId, taskId }) => {
    if (!file) throw new Error("❌ No file provided for upload");

    let fileKey;
    let uploadMetadata = {};

    if (fileType === "profilePic") {
        fileKey = `staff-profile-pictures/${staffId}/profile.jpg`;
    } else if (fileType === "resume") {
        fileKey = `staff-resumes/${staffId}/resume.pdf`;
    } else if (projectId || taskId) {
        if (projectId && !(await Project.findById(projectId))) throw new Error("❌ Invalid project ID");
        if (taskId && !(await Task.findById(taskId))) throw new Error("❌ Invalid task ID");

        fileKey = `project-files/${projectId || "general"}/${Date.now()}-${file.originalname}`;
        uploadMetadata = {
            fileName: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            fileURL: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
            uploadedBy: staffId,
            project: projectId || null,
            task: taskId || null
        };
    } else {
        throw new Error("❌ Invalid file type or missing project/task ID");
    }

    const fileUrl = await uploadToS3(file.buffer, fileKey, file.mimetype, fileType === "profilePic");

    if (projectId || taskId) {
        await File.create(uploadMetadata);
    }

    return { fileUrl, signedUrl: await getFileUrl(fileKey) };
};

/**
 * ✅ Get file stream (for preview/download)
 */
const getFileStream = async (key) => {
    if (!key) throw new Error("❌ File key is required");
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    return await s3.send(command);
};

/**
 * ✅ Delete file from S3 & remove from MongoDB
 */
const deleteFile = async (key) => {
    if (!key) throw new Error("❌ File key is required");

    const existingFile = await File.findOneAndDelete({ fileURL: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}` });
    if (!existingFile) {
        throw new Error("❌ File not found in database");
    }

    const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    await s3.send(command);
    return { success: true, message: "✅ File deleted successfully" };
};

/**
 * ✅ Upload report file (task, attendance, performance)
 */
const uploadReportFile = async (buffer, fileName, folder = "project-reports/") => {
    if (!buffer || !fileName) throw new Error("❌ Buffer and fileName required");
    const fileKey = `${folder}${Date.now()}-${fileName}`;
    return uploadToS3(buffer, fileKey, "application/pdf", false);
};

/**
 * ✅ Get pre-signed URL for file access
 */
const getFileUrl = async (fileKey) => {
    if (!fileKey) throw new Error("❌ File key is required");
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey });
    return await getSignedUrl(s3, command, { expiresIn: 3600 });
};

/**
 * ✅ Delete expired reports (older than 1 year)
 */
const deleteExpiredReports = async () => {
    try {
        const allFiles = await listFilesInFolder("project-reports/");
        const expirationTime = Date.now() - 365 * 24 * 60 * 60 * 1000;

        for (const file of allFiles) {
            const fileTimestamp = parseInt(file.Key.match(/\d+/g)?.[0]);
            if (fileTimestamp && fileTimestamp < expirationTime) {
                await deleteFile(file.Key);
                console.log(`🗑️ Deleted expired report: ${file.Key}`);
            }
        }
    } catch (error) {
        console.error("❌ Error auto-deleting expired reports:", error);
    }
};

/**
 * ✅ Upload helper function
 */
const uploadToS3 = async (buffer, key, contentType, isPublic = false) => {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: isPublic ? "public-read" : "private"
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

module.exports = { upload, uploadFile, getFileStream, deleteFile, uploadReportFile, getFileUrl, deleteExpiredReports };
