const fileService = require("../services/fileService");
const File = require("../models/File");
const Task = require("../models/Task");
const Project = require("../models/Project");

/**
 * ✅ Upload a file to AWS S3 and save metadata to MongoDB.
 * Supports:
 * - Profile Picture & Resume (No MongoDB save, stored in S3)
 * - Project & Task files (Stored in both MongoDB & S3)
 */
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const { projectId, taskId, fileType } = req.body;
        const staffId = req.user.id;

        // ✅ Validate fileType (Only allow 'profilePic', 'resume', or null)
        if (fileType && !['profilePic', 'resume'].includes(fileType)) {
            return res.status(400).json({ success: false, message: "Invalid file type" });
        }

        // ✅ Ensure project/task exists if provided
        if (projectId && !(await Project.exists({ _id: projectId }))) {
            return res.status(400).json({ success: false, message: "Invalid project ID" });
        }
        if (taskId && !(await Task.exists({ _id: taskId }))) {
            return res.status(400).json({ success: false, message: "Invalid task ID" });
        }

        // ✅ Upload file to AWS S3
        const fileUrl = await fileService.uploadFile(req.file, { fileType, staffId });

        // ✅ Save to MongoDB only if it's a task/project file
        if (!fileType) {
            const fileRecord = await File.create({
                fileName: req.file.originalname,
                fileType: req.file.mimetype,
                fileSize: req.file.size,
                fileURL: fileUrl,
                uploadedBy: req.user.id,
                project: projectId || null,
                task: taskId || null,
            });

            return res.status(201).json({
                success: true,
                message: "File uploaded successfully",
                data: fileRecord
            });
        }

        // ✅ If profilePic or resume, return URL without saving to DB
        res.status(201).json({
            success: true,
            message: `${fileType} uploaded successfully`,
            fileURL: fileUrl
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "File upload failed",
            error: error.message
        });
    }
};

/**
 * ✅ Retrieve a file from AWS S3.
 * - Staff can only access their own files.
 * - Admins can access all files.
 */
const getFile = async (req, res) => {
    try {
        const { filename } = req.params;

        // ✅ Check if the file exists in MongoDB (for project/task files)
        const fileRecord = await File.findOne({ fileName: filename });

        if (!fileRecord) {
            return res.status(404).json({ success: false, message: "File not found" });
        }

        // ✅ Prevent unauthorized file access
        if (req.user.role !== "admin" && req.user.id !== fileRecord.uploadedBy.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access to this file." });
        }

        const fileStream = await fileService.getFileStream(fileRecord.fileURL);

        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        fileStream.pipe(res);
    } catch (error) {
        res.status(404).json({
            success: false,
            message: "File not found",
            error: error.message
        });
    }
};

/**
 * ✅ Delete a file from AWS S3 and remove its record from MongoDB.
 * - Only Admins or File Owners can delete.
 */
const deleteFile = async (req, res) => {
    try {
        const { filename } = req.params;

        // ✅ Ensure file exists before deleting
        const fileRecord = await File.findOne({ fileName: filename });
        if (!fileRecord) {
            return res.status(404).json({ success: false, message: "File record not found" });
        }

        // ✅ Prevent unauthorized deletion
        if (req.user.role !== "admin" && req.user.id !== fileRecord.uploadedBy.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized to delete this file." });
        }

        // ✅ Delete file from AWS S3
        await fileService.deleteFile(fileRecord.fileURL);

        // ✅ Remove from MongoDB
        await File.deleteOne({ _id: fileRecord._id });

        res.status(200).json({
            success: true,
            message: "File deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "File deletion failed",
            error: error.message
        });
    }
};

module.exports = {
    uploadFile,
    getFile,
    deleteFile,
};
