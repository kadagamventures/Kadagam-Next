const AWS = require("../config/awsConfig");
const { v4: uuidv4 } = require("uuid");

const s3 = AWS.s3;
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

/**
 * ✅ Upload a task attachment to S3.
 * - Stored under "task-attachments/{uuid}-filename" for uniqueness.
 * - Returns a pre-signed URL instead of a public URL for security.
 * @param {Object} file - Multer file object (buffer, mimetype, originalname, etc.)
 * @returns {string} - Pre-signed S3 URL for file access
 */
const uploadTaskAttachment = async (file) => {
    if (!file) throw new Error("❌ No file provided for upload.");

    const fileKey = `task-attachments/${uuidv4()}-${file.originalname}`;
    const params = {
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
    };

    await s3.upload(params).promise();
    return getTaskAttachmentUrl(fileKey); // Return secure pre-signed URL
};

/**
 * ✅ Fetch file stream for preview/download.
 * - Used when staff/admin want to preview/download a specific attachment.
 * @param {string} fileKey - Full S3 key (e.g., task-attachments/uuid-filename.pdf)
 * @returns {Stream} - Readable file stream from S3
 */
const getTaskAttachmentStream = async (fileKey) => {
    if (!fileKey) throw new Error("❌ File key is required to fetch file stream.");

    const params = {
        Bucket: BUCKET_NAME,
        Key: fileKey,
    };

    try {
        return s3.getObject(params).createReadStream();
    } catch (error) {
        console.error("❌ Error fetching file stream:", error);
        throw new Error("Failed to fetch file. Please check if the file exists.");
    }
};

/**
 * ✅ Generate a pre-signed URL for secure access.
 * - Ensures that files are not publicly accessible.
 * @param {string} fileKey - Full S3 key (e.g., task-attachments/uuid-filename.pdf)
 * @returns {string} - Pre-signed URL valid for 1 hour
 */
const getTaskAttachmentUrl = async (fileKey) => {
    if (!fileKey) throw new Error("❌ File key is required for generating URL.");

    try {
        return s3.getSignedUrl("getObject", {
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Expires: 3600, // 1 hour expiration
        });
    } catch (error) {
        console.error(`❌ Error generating pre-signed URL for file: ${fileKey}`, error);
        throw new Error(`Could not generate signed URL for ${fileKey}`);
    }
};

/**
 * ✅ Delete a specific task attachment from S3.
 * - Used when a task is deleted or when cleaning up orphaned files.
 * @param {string} fileKey - Full S3 key (e.g., task-attachments/uuid-filename.pdf)
 * @returns {Object} - Success confirmation message
 */
const deleteTaskAttachment = async (fileKey) => {
    if (!fileKey) throw new Error("❌ File key is required to delete file.");

    const params = {
        Bucket: BUCKET_NAME,
        Key: fileKey,
    };

    await s3.deleteObject(params).promise();
    return { success: true, message: "File deleted successfully" };
};

/**
 * ✅ List all files in the "task-attachments/" folder.
 * - Useful for admin audits or orphaned file cleanup.
 * @returns {Array} - List of file objects (Key, LastModified, Size, etc.)
 */
const listTaskAttachments = async () => {
    const params = {
        Bucket: BUCKET_NAME,
        Prefix: "task-attachments/",
    };

    const listedObjects = await s3.listObjectsV2(params).promise();
    return listedObjects.Contents.map(file => ({
        key: file.Key,
        lastModified: file.LastModified,
        size: file.Size,
    }));
};

module.exports = {
    uploadTaskAttachment,
    getTaskAttachmentStream,
    getTaskAttachmentUrl,  // ✅ New method for secure pre-signed URL
    deleteTaskAttachment,
    listTaskAttachments,  // ✅ Now includes file size & last modified date
};
