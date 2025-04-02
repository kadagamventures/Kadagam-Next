const express = require("express");
const router = express.Router();
const { uploadFile, getFile, deleteFile } = require("../controllers/fileController");
const { uploadSingleProfilePic, uploadSingleResume, validateFile } = require("../middlewares/fileUploadMiddleware");
const { verifyToken, requireAdmin } = require("../middlewares/authMiddleware");
const { errorHandler } = require("../middlewares/errorMiddleware"); 

// ✅ Apply Authentication Middleware (Only Logged-in Users)
router.use(verifyToken);

/**
 * ✅ Upload Profile Picture (Admin Only)
 */
router.post("/upload/profile-pic", requireAdmin, uploadSingleProfilePic, validateFile, uploadFile);

/**
 * ✅ Upload Resume (Admin Only)
 */
router.post("/upload/resume", requireAdmin, uploadSingleResume, validateFile, uploadFile);

/**
 * ✅ Get Staff File (Staff can only access their own, Admin can access all)
 */
router.get("/:filename", verifyToken, getFile);

/**
 * ✅ Delete Staff File (Admin or File Owner)
 */
router.delete("/:filename", verifyToken, deleteFile);

// ✅ Global Error Handler
router.use(errorHandler);

module.exports = router;
