const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");

/**
 *  Get Notifications for Logged-In Staff
 *  Fetches the latest notifications (within 1-day TTL) for a staff member.
 *  Supports optional pagination (future-proof).
 */
const getNotifications = asyncHandler(async (req, res) => {
    const staffId = req.user.id;  // From authMiddleware
    const { page = 1, limit = 20 } = req.query;  // Optional pagination

    const notifications = await Notification.find({ staffId })
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean();

    res.status(200).json({
        success: true,
        data: notifications,
        page: parseInt(page),
        limit: parseInt(limit),
    });
});

/**
 *  Force Cleanup Old Notifications - Admin Only (For Manual Trigger)
 */
const cleanupOldNotifications = asyncHandler(async (req, res) => {
    const { manualCleanupOldNotifications } = require("../services/websocketNotificationService");
    await manualCleanupOldNotifications();

    res.status(200).json({ success: true, message: "Old notifications cleaned up successfully." });
});

module.exports = {
    getNotifications,
    cleanupOldNotifications,
};
