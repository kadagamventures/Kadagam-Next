const cron = require("node-cron");
const Task = require("../models/Task");
const { emitDashboardUpdate } = require("../services/websocketService");

/**
 * ✅ Scheduled Cleanup: Deletes Daily Task Updates Older Than 3 Days
 * Runs daily at 2 AM
 */
cron.schedule("0 2 * * *", async () => {
    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        // 🔍 Delete only tasks that contain old comments
        const result = await Task.updateMany(
            { "dailyComments.createdAt": { $lt: threeDaysAgo } },  // Only tasks with outdated comments
            { $pull: { dailyComments: { createdAt: { $lt: threeDaysAgo } } } }
        );

        console.log(`✅ Task Comments Cleanup: ${result.modifiedCount} tasks affected.`);

        // 📢 Notify the dashboard that old task updates were removed
        emitDashboardUpdate(null, "taskUpdatesCleared");

    } catch (error) {
        console.error("❌ Error deleting old task updates:", error);
    }
});

console.log("⏳ Scheduled Task Update Cleanup Job (Runs Daily @ 2 AM)");
