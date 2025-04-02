const { getIO } = require("../config/websocketConfig");
const taskReportService = require("../services/reportServices/taskReportService");

const activeUsers = new Map();
let dashboardUpdateCooldown = false;

const taskWebSocket = (io) => {
    const taskNamespace = io.of("/tasks");

    taskNamespace.on("connection", (socket) => {
        console.log(`✅ Task WebSocket Connected: ${socket.id}`);

        /**
         * 🔗 Register User for Task Notifications
         */
        socket.on("registerUser", (userId) => {
            if (userId) {
                activeUsers.set(userId, socket.id);
                socket.join(userId); // Ensure the user joins their own room for messages
                console.log(`👤 User Registered: ${userId} -> ${socket.id}`);
            } else {
                console.warn("⚠️ Missing userId in registerUser event.");
            }
        });

        /**
         * 🆕 Task Created Event
         */
        socket.on("taskCreated", async (task) => {
            try {
                if (!task || !Array.isArray(task.assignedTo)) {
                    console.warn("⚠️ Invalid taskCreated event: Missing task data.");
                    return;
                }

                console.log(`🆕 Task Created:`, task);

                // ✅ Lazy-load dependencies to prevent circular import issues
                const { sendTaskNotification } = require("../notifications/websocketNotifications");

                // Notify Assigned Users
                task.assignedTo.forEach(userId => {
                    if (activeUsers.has(userId)) {
                        sendTaskNotification(userId, `New Task Assigned: ${task.title}`);
                        taskNamespace.to(userId).emit("taskCreated", task);
                    }
                });

                // Emit update to all connected users
                taskNamespace.emit("taskCreated", task);

                // Update Dashboard
                updateDashboard(taskNamespace);
            } catch (err) {
                console.error("❌ Error in taskCreated event:", err.message);
                socket.emit("taskError", { message: "Failed to create task." });
            }
        });

        /**
         * 📢 Task Status Update Event
         */
        socket.on("taskStatusUpdate", async ({ staffId, staffName, taskId, comment }) => {
            try {
                if (!staffId || !taskId || !comment) {
                    console.warn("⚠️ Invalid taskStatusUpdate event: Missing fields.");
                    return;
                }

                console.log(`📢 Task Status Update | Staff: ${staffName} | Task ID: ${taskId} | Comment: ${comment}`);

                // ✅ Lazy-load dependencies to prevent circular import issues
                const { emitDailyTaskUpdateToAdmin } = require("../notifications/websocketNotifications");

                // Notify Admins
                emitDailyTaskUpdateToAdmin(`Task Update: ${staffName} updated task ${taskId}`);

                // Emit update only to affected users
                taskNamespace.to(staffId).emit("taskUpdateList", { staffId, staffName, taskId, comment, date: new Date() });

                // Update Dashboard
                updateDashboard(taskNamespace);
            } catch (err) {
                console.error("❌ Error in taskStatusUpdate event:", err.message);
                socket.emit("taskError", { message: "Failed to update task status." });
            }
        });

        /**
         * ❌ Handle Disconnect
         */
        socket.on("disconnect", () => {
            try {
                for (const [userId, socketId] of activeUsers.entries()) {
                    if (socketId === socket.id) {
                        activeUsers.delete(userId);
                        console.log(`❌ User Disconnected: ${userId}`);
                        break;
                    }
                }
            } catch (err) {
                console.error("❌ Error handling disconnect:", err.message);
            }
        });

        /**
         * ⚠️ Handle Socket Errors
         */
        socket.on("error", (err) => {
            console.error(`❌ Task WebSocket Error: ${err.message}`);
            socket.emit("taskError", { message: "A WebSocket error occurred." });
        });
    });
};

/**
 * 📊 Dashboard Update (Prevents Excessive Updates with Cooldown)
 */
const updateDashboard = async (io) => {
    if (dashboardUpdateCooldown) return;

    try {
        // ✅ Lazy-load to fix circular dependency
        const { emitDashboardMetricsUpdate } = require("../services/websocketService");

        emitDashboardMetricsUpdate();

        const stats = await taskReportService.getLiveTaskStats();
        io.emit("taskReportUpdate", stats);
    } catch (err) {
        console.error("❌ Failed to fetch task report stats:", err);
    }

    dashboardUpdateCooldown = true;
    setTimeout(() => {
        dashboardUpdateCooldown = false;
    }, 5000);
};

module.exports = taskWebSocket;
