const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const cron = require("node-cron");

/**
 * ✅ Auto-Cleanup of Notifications
 * Runs at 23:59 daily to:
 * - Delete read notifications from the same day.
 * - Delete unread **task updates** older than 3 days.
 * - Delete unread **other notifications** older than 7 days.
 */
const cleanupOldNotifications = async () => {
    try {
        const now = new Date();
        const endOfDay = new Date(now.setHours(23, 59, 59, 999));
        const threeDaysAgo = new Date(now.setDate(now.getDate() - 3));
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));

        // 🗑 Delete read notifications at midnight
        const deletedRead = await Notification.deleteMany({
            isRead: true,
            expiresAt: { $lte: endOfDay },
        });

        // 🗑 Delete unread **task update** notifications after 3 days
        const deletedTaskUpdates = await Notification.deleteMany({
            isRead: false,
            createdAt: { $lt: threeDaysAgo },
            message: /Task Update:/, // Only delete task update notifications
        });

        // 🗑 Delete unread **other notifications** after 7 days
        const deletedUnread = await Notification.deleteMany({
            isRead: false,
            createdAt: { $lt: sevenDaysAgo },
            message: { $not: /Task Update:/ }, // Exclude task updates (already deleted separately)
        });

        console.log(`🧹 Notifications Cleanup Done: ${deletedRead.deletedCount} read, ${deletedTaskUpdates.deletedCount} task updates, ${deletedUnread.deletedCount} other`);
    } catch (error) {
        console.error("❌ Error during notification cleanup:", error.message);
    }
};

/**
 * ⏳ Schedule Cleanup Job (Runs every night at 23:59)
 */
cron.schedule("59 23 * * *", async () => {
    console.log("🕛 Running Scheduled Notification Cleanup...");
    await cleanupOldNotifications();
});

/**
 * 🔄 Manual Cleanup Trigger (For Admin Use)
 */
const manualCleanupOldNotifications = async () => {
    console.log("⚡ Manual Notification Cleanup Triggered...");
    await cleanupOldNotifications();
};

module.exports = {
    cleanupOldNotifications,
    manualCleanupOldNotifications,
};
