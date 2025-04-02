const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const cron = require("node-cron");

// Schedule the job to run daily at midnight (00:00 UTC)
cron.schedule("0 0 * * *", async () => {
    try {
        const attendanceThreshold = new Date();
        attendanceThreshold.setFullYear(attendanceThreshold.getFullYear() - 1);
        attendanceThreshold.setUTCHours(0, 0, 0, 0); // ✅ Ensure UTC consistency

        const leaveThreshold = new Date();
        leaveThreshold.setFullYear(leaveThreshold.getFullYear() - 1);
        leaveThreshold.setUTCHours(0, 0, 0, 0); // ✅ Ensure UTC consistency

        //  Delete Attendance records older than 1 year
        try {
            const attendanceResult = await Attendance.deleteMany({ date: { $lt: attendanceThreshold } });
            console.log(
                attendanceResult.deletedCount > 0
                    ? `✅ Old attendance records cleared: ${attendanceResult.deletedCount}`
                    : "⚠ No old attendance records found to delete."
            );
        } catch (error) {
            console.error("❌ Error deleting old attendance records:", error);
        }

        //  Delete Leave requests older than 1 year
        try {
            const leaveResult = await Leave.deleteMany({ createdAt: { $lt: leaveThreshold } });
            console.log(
                leaveResult.deletedCount > 0
                    ? `✅ Old leave records cleared: ${leaveResult.deletedCount}`
                    : "⚠ No old leave records found to delete."
            );
        } catch (error) {
            console.error("❌ Error deleting old leave records:", error);
        }
    } catch (error) {
        console.error("❌ Critical error during cleanup process:", error);
    }
});

console.log("⏳ Attendance and Leave cleanup job scheduled...");
