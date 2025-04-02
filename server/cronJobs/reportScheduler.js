const cron = require("node-cron");

// Report Generation Jobs
const generateMonthlyReports = require("../cronJobs/generateMonthlyReports");
const generateYearlyReports = require("../cronJobs/generateYearlyReports");
const { generateMonthlyPerformanceReports, generateYearlyPerformanceReports } = require("../cronJobs/generatePerformanceReports");

// Maintenance Jobs (from stuct)
const clearOldDailyComments = require("../services/taskService").clearOldDailyComments;  // Direct from taskService (Reviewed)
const clearOldTaskUpdates = require("../cronJobs/clearOldTaskUpdates");
const optimizeDatabase = require("../cronJobs/optimizeDatabase");

/**
 * 🔹 Monthly Reports - 1st of every month at 12:00 AM
 */
cron.schedule("0 0 1 * *", async () => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    try {
        console.log("📊 Running Monthly Report Generation...");

        await generateMonthlyReports();
        await generateMonthlyPerformanceReports(currentMonth, currentYear);

        console.log("✅ Monthly Reports (including Performance) Generated.");
    } catch (error) {
        console.error("❌ Monthly Report Generation Failed:", error);
    }
});

/**
 * 🔹 Yearly Reports - January 1st at 1:00 AM
 */
cron.schedule("0 1 1 1 *", async () => {
    const currentYear = new Date().getFullYear();
    try {
        console.log("📊 Running Yearly Report Generation...");

        await generateYearlyReports();
        await generateYearlyPerformanceReports(currentYear);

        console.log("✅ Yearly Reports (including Performance) Generated.");
    } catch (error) {
        console.error("❌ Yearly Report Generation Failed:", error);
    }
});

/**
 * 🔹 Daily Cleanup - Clear Daily Comments Older Than 3 Days (Every Day at 2:00 AM)
 */
cron.schedule("0 2 * * *", async () => {
    try {
        console.log("🧹 Running Daily Comment Cleanup...");
        await clearOldDailyComments();
        console.log("✅ Old Daily Comments Cleared.");
    } catch (error) {
        console.error("❌ Daily Comment Cleanup Failed:", error);
    }
});

/**
 * 🔹 Daily Cleanup - Clear Old Task Updates (Every Day at 2:15 AM)
 */
cron.schedule("15 2 * * *", async () => {
    try {
        console.log("🧹 Running Old Task Updates Cleanup...");
        await clearOldTaskUpdates();
        console.log("✅ Old Task Updates Cleared.");
    } catch (error) {
        console.error("❌ Old Task Updates Cleanup Failed:", error);
    }
});

/**
 * 🔹 Daily Database Optimization (Every Day at 3:00 AM)
 */
cron.schedule("0 3 * * *", async () => {
    try {
        console.log("🛠️ Running Database Optimization...");
        await optimizeDatabase();
        console.log("✅ Database Optimization Completed.");
    } catch (error) {
        console.error("❌ Database Optimization Failed:", error);
    }
});

console.log("⏳ Report & Maintenance Schedulers Initialized...");
