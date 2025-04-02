const cron = require("node-cron");
const mongoose = require("mongoose");
const Leave = require("../models/Leave");
const { connectDB, closeDB } = require("../config/dbConfig");

/**
 * ✅ Soft delete leave records older than one year (instead of permanent deletion).
 */
const cleanupOldLeaves = async () => {
    try {
        console.log("🔄 Cleaning up old leave records...");

        await connectDB(); // ✅ Use standard DB connection

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // 🔍 Count total leaves eligible for cleanup
        const totalLeaves = await Leave.countDocuments({
            createdAt: { $lt: oneYearAgo },
            isDeleted: false,
            type: { $ne: "declared_leave" }
        });

        if (totalLeaves === 0) {
            console.log("✅ No old leave records to clean up.");
            return;
        }

        // ✅ Soft delete old leave records (EXCLUDE declared leave)
        const result = await Leave.updateMany(
            { 
                createdAt: { $lt: oneYearAgo },
                isDeleted: false,  // ✅ Ensure we don't process already deleted records
                type: { $ne: "declared_leave" } // ✅ Exclude declared leave
            },
            { $set: { isDeleted: true, deletedAt: new Date() } } // ✅ Mark as deleted with timestamp
        );

        console.log(`🗑️ Processed ${totalLeaves} old leave records.`);
        console.log(`✅ Soft deleted ${result.modifiedCount} leave records.`);

    } catch (error) {
        console.error("❌ Error cleaning up old leave records:", error);
    } finally {
        await closeDB();
    }
};

/**
 * ✅ Scheduled Cron Job: Runs Every Sunday at 3 AM
 */
cron.schedule("0 3 * * 0", async () => {
    console.log("⏳ Running scheduled leave cleanup job...");
    await cleanupOldLeaves();
});

module.exports = cleanupOldLeaves;
