const mongoose = require("mongoose");
const cron = require("node-cron");
const Task = require("../models/Task");
const ArchivedTask = require("../models/ArchivedTask");
const { getIO } = require("../config/websocketConfig");
const { connectDB, closeDB } = require("../config/dbConfig");

const ARCHIVE_DAYS = 30; // Number of days after which tasks are archived

/**
 * ✅ Archive Completed Tasks Older Than ARCHIVE_DAYS
 */
const archiveCompletedTasks = async () => {
    try {
        console.log("🔄 Archiving old completed tasks...");

        await connectDB(); // ✅ Use standard database connection

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - ARCHIVE_DAYS);

        // 🔍 Find completed tasks older than ARCHIVE_DAYS
        const tasksToArchive = await Task.find({
            status: "Completed",
            updatedAt: { $lte: cutoffDate }
        });

        if (tasksToArchive.length === 0) {
            console.log("✅ No completed tasks to archive.");
            return;
        }

        // 🟢 Move tasks to ArchivedTask collection
        const archivedTasks = tasksToArchive.map(task => ({
            originalTaskId: task._id,
            title: task.title,
            description: task.description,
            project: task.project,
            assignedTo: task.assignedTo,
            status: "Archived",
            completedAt: task.updatedAt,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt // ✅ Keep last update date
        }));

        await ArchivedTask.insertMany(archivedTasks);

        // 🗑 Delete archived tasks from active Task collection
        await Task.deleteMany({ _id: { $in: tasksToArchive.map(task => task._id) } });

        // 📢 Notify admin dashboard about archived tasks
        const io = getIO();
        io.to("admin").emit("tasksArchived", {
            archivedCount: tasksToArchive.length,
            lastArchivedDate: cutoffDate.toISOString()
        });

        console.log(`✅ Archived ${tasksToArchive.length} completed tasks.`);
    } catch (error) {
        console.error("❌ Error archiving completed tasks:", error);
    } finally {
        await closeDB();
    }
};

/**
 * ✅ Scheduled Cron Job: Runs Every Sunday at 1 AM
 */
cron.schedule("0 1 * * 0", async () => {
    console.log("⏳ Running scheduled task archiving job...");
    await archiveCompletedTasks();
});

module.exports = archiveCompletedTasks;
