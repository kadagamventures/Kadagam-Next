const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middlewares/authMiddleware");

// ✅ Controller to fetch staff permissions
const getPermissions = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user found." });
    }

    if (!req.user.permissions || req.user.permissions.length === 0) {
      return res.status(403).json({ success: false, message: "Forbidden: No permissions assigned" });
    }

    return res.status(200).json({ success: true, permissions: req.user.permissions });
  } catch (error) {
    console.error("❌ [Permissions Error]:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ✅ Protect route with authentication middleware
router.get("/permissions", verifyToken, getPermissions);

module.exports = router;
