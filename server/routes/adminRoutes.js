const express = require("express");
const multer = require("multer");
const router = express.Router();
const { verifyToken, requireAdmin } = require("../middlewares/authMiddleware");
const checkPermissions = require("../middlewares/permissionsMiddleware");

const {
  addStaff,
  getAllStaff,
  getStaffById,
  updateStaff,
  deleteStaff,
  uploadStaffProfilePic,
  uploadStaffResume,
  getStaffFormData,
  checkStaffId,
  getUserProfile,
  getMyProfile, // Staff can fetch their own profile
  getStaffByEmail
} = require("../controllers/userController");

// File Upload Middleware (Memory Storage, 5MB Limit)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB Limit
});

// Protect All Routes (Login Required)
router.use(verifyToken);

/**
 * Staff Management (Admin & Permissioned Staff)
 * - Admins have full access.
 * - Staff with `manage_staff` can add/edit staff but CANNOT delete.
 */
// **Updated: Add multer middleware (upload.any()) to parse multipart/form-data**
router.post("/staff", checkPermissions("manage_staff"), upload.any(), addStaff);
router.get("/staff", checkPermissions("manage_staff"), getAllStaff);

// IMPORTANT: Place /staff/check-id before /staff/:id to avoid route conflicts.
router.get("/staff/check-id", verifyToken, checkStaffId);
router.get("/staff/form-data", checkPermissions("manage_staff"), getStaffFormData);

// Routes with parameter :id come after.
router.get("/staff/:id", checkPermissions("manage_staff"), getStaffById);
router.put("/staff/:id", checkPermissions("manage_staff"), updateStaff);
router.delete("/staff/:id", requireAdmin, deleteStaff); // Only admins can delete staff

/**
 * File Uploads (Profile Picture & Resume)
 * - Upload profile picture (Max: 5MB).
 * - Upload resume (Max: 5MB).
 */
router.put(
  "/staff/:id/profile-pic",
  checkPermissions("manage_staff"),
  upload.single("profilePic"),
  uploadStaffProfilePic
);

router.put(
  "/staff/:id/resume",
  checkPermissions("manage_staff"),
  upload.single("resume"),
  uploadStaffResume
);

/**
 * User Profile Routes
 * - getMyProfile: Staff can view their own profile.
 * - getUserProfile: Admins & permissioned staff can view any profile.
 */
router.get("/staff/my-profile", verifyToken, getMyProfile);
router.get("/staff/profile/:id", checkPermissions("manage_staff"), getUserProfile);

/**
 * Get Staff by Email (Used in Auth & Forgot Password)
 * - Uses req.query.email instead of req.body.email.
 */
router.get("/staff/by-email", checkPermissions("manage_staff"), getStaffByEmail);

module.exports = router;
