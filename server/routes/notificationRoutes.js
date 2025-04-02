const express = require("express");
const { getNotifications, cleanupOldNotifications } = require("../controllers/notificationController");
const { verifyToken, requireAdmin } = require("../middlewares/authMiddleware");

const router = express.Router();

/**
 * 📥 Get Notifications (Staff Dashboard)
 * - Staff can see their personal notifications (last 1 day max).
 */
router.get("/", verifyToken, getNotifications); // ✅ Changed `protect` to `verifyToken`

/**
 * 🧹 Force Cleanup Old Notifications (Admin Only)
 * - Optional endpoint for manual trigger (rarely used, as auto-cleanup exists).
 */
router.delete("/cleanup", verifyToken, requireAdmin, cleanupOldNotifications); // ✅ Changed `checkAdmin` to `requireAdmin`

module.exports = router;
