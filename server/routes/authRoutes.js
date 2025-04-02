const express = require("express");
const router = express.Router();
const { verifyToken, verifyRefreshToken } = require("../middlewares/authMiddleware");

// ✅ Import Auth Controller
const {
    adminLogin,
    staffLogin,
    logout,
    requestPasswordReset,
    resetPassword,
    getCurrentUser,
    refreshToken
} = require("../controllers/authController");

// ==============================
// 🚀 Public Auth Routes (No Token Required)
// ==============================

// ✅ Admin Login (Supports Email & Staff ID)
router.post("/admin/login", adminLogin);

// ✅ Staff Login (Supports Email & Staff ID)
router.post("/staff/login", staffLogin);

// ✅ Request Password Reset (User requests reset link)
router.post("/forgot-password", requestPasswordReset);

// ✅ Reset Password (User sets a new password using token)
router.post("/reset-password", resetPassword);

// ✅ Refresh Access Token using Refresh Token
router.post("/refresh", verifyRefreshToken, refreshToken);

// ==============================
// 🔒 Protected Auth Routes (Requires Authentication)
// ==============================

// ✅ Apply Authentication Middleware for Below Routes
router.use(verifyToken);

// ✅ Get Current User Details
router.get("/current-user", getCurrentUser);

// ✅ Logout User (Clears Tokens)
router.post("/logout", logout);

module.exports = router;
