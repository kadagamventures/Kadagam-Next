const multer = require("multer");

const storage = multer.memoryStorage();

const profilePicTypes = ["image/jpeg", "image/png"];
const resumeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
];

const fileFilter = (allowedTypes) => (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file format. Allowed formats: ${allowedTypes.join(", ")}`), false);
    }
};

const createUploadMiddleware = (allowedTypes, maxSize) => multer({
    storage,
    fileFilter: fileFilter(allowedTypes),
    limits: { fileSize: maxSize }
});

const uploadProfilePic = createUploadMiddleware(profilePicTypes, 50 * 1024);
const uploadResume = createUploadMiddleware(resumeTypes, 200 * 1024);

const uploadSingleProfilePic = (fieldName) => (req, res, next) => {
    uploadProfilePic.single(fieldName)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

const uploadSingleResume = (fieldName) => (req, res, next) => {
    uploadResume.single(fieldName)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ success: false, message: err.message });
        }
        next();
    });
};

const validateFile = (req, res, next) => {
    if (!req.file && (!req.files || req.files.length === 0)) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    next();
};

const multerErrorHandler = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: err.code === "LIMIT_FILE_SIZE" ? "File size exceeds the allowed limit" : err.message });
    }
    next(err);
};

module.exports = { uploadSingleProfilePic, uploadSingleResume, validateFile, multerErrorHandler };
