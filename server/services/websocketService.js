const taskReportService = require("../services/reportServices/taskReportService");

const taskWebSocket = require("../websockets/taskWebSocket");
const projectWebSocket = require("../websockets/projectWebSocket");
const attendanceWebSocket = require("../websockets/attendanceWebSocket");
const leaveWebSocket = require("../websockets/leaveWebSocket");

const { redisClient } = require("../config/redisConfig");

const userSockets = new Map();
const callCounts = new Map();

/**
 * 🔥 Initialize WebSockets & Attach Event Handlers
 */
const handleSocketEvents = (io) => {
    console.log("🚀 WebSocket Server Running...");

    io.on("connection", (socket) => {
        console.log(`✅ WebSocket Connected: ${socket.id}`);

        /**
         * 🔗 Personal Room Registration (Notification System)
         */
        socket.on("registerUser", async (userId, role) => {
            if (!userId) return;

            userSockets.set(userId, socket.id);
            socket.join(userId);
            if (role === "admin") socket.join("admin");

            // ✅ Send offline notifications
            if (redisClient.isOpen) {
                const storedNotifications = await redisClient.lrange(`offlineNotifications:${userId}`, 0, -1);
                storedNotifications.forEach((notif) => io.to(userId).emit("notification", JSON.parse(notif)));
                await redisClient.del(`offlineNotifications:${userId}`);
            }
        });

        /**
         * 📬 Private Messaging - Rate limited
         */
        socket.on("sendMessage", rateLimit(5, 10, ({ receiverId, message }) => {
            if (receiverId) io.to(receiverId).emit("receiveMessage", { message });
        }));

        /**
         * 📊 Task & Dashboard Metrics Updates
         */
        socket.on("taskUpdated", emitTaskReportUpdate);
        socket.on("requestDashboardUpdate", emitDashboardMetricsUpdate);

        /**
         * ✅ Staff Management Events
         */
        socket.on("staffCreated", (staff) => handleStaffEvent("staffCreated", staff));
        socket.on("staffUpdated", (staff) => handleStaffEvent("staffUpdated", staff));
        socket.on("staffDeleted", ({ staffId }) => handleStaffEvent("staffDeleted", { staffId }));

        /**
         * 🛑 Handle Disconnect
         */
        socket.on("disconnect", (reason) => {
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    userSockets.delete(userId);
                    console.log(`❌ User Disconnected: ${userId} (${reason})`);
                    break;
                }
            }
        });

        /**
         * ⚠️ Handle Socket Errors
         */
        socket.on("error", (err) => {
            console.error(`❌ WebSocket Error: ${err.message}`);
            io.to("admin").emit("websocketError", { error: err.message });
        });

        /**
         * 🔄 Heartbeat to Prevent Disconnections
         */
        socket.on("ping", () => {
            socket.emit("pong", "heartbeat-ack"); // ✅ Reply to keep connection alive
        });
    });

    // ✅ Attach WebSocket Modules
    attachWebSocketModule("taskWebSocket", taskWebSocket, io);
    attachWebSocketModule("projectWebSocket", projectWebSocket, io);
    attachWebSocketModule("attendanceWebSocket", attendanceWebSocket, io, emitDashboardMetricsUpdate);
    attachWebSocketModule("leaveWebSocket", leaveWebSocket, io);
};

/**
 * 📡 Emit Notification to Specific User
 */
const emitNotification = async (userId, notificationData) => {
    const getIO = require("../config/websocketConfig").getIO;
    const io = getIO();
    if (!io) return;

    if (userSockets.has(userId)) {
        io.to(userId).emit("notification", notificationData);
    } else if (redisClient.isOpen) {
        await redisClient.rpush(`offlineNotifications:${userId}`, JSON.stringify(notificationData));
    }
};

/**
 * 📡 Broadcast Notification to All Admins
 */
const emitNotificationToAdmins = (notificationData) => {
    const getIO = require("../config/websocketConfig").getIO;
    const io = getIO();
    if (io) io.to("admin").emit("notification", notificationData);
};

/**
 * 📊 Emit Dashboard Metrics Update
 */
const emitDashboardMetricsUpdate = async () => {
    try {
        const getIO = require("../config/websocketConfig").getIO;
        const io = getIO();
        if (!io) return;

        const stats = await taskReportService.getLiveTaskStats();
        io.emit("dashboardMetricsUpdate", stats);
    } catch (err) {
        console.error("❌ Error emitting dashboard metrics update:", err.message);
    }
};

/**
 * 📊 Emit Task Report Update
 */
const emitTaskReportUpdate = async () => {
    try {
        const getIO = require("../config/websocketConfig").getIO;
        const io = getIO();
        if (!io) return;

        const stats = await taskReportService.getLiveTaskStats();
        io.emit("taskReportUpdate", stats);
    } catch (err) {
        console.error("❌ Error emitting task report update:", err.message);
    }
};

/**
 * 📡 Handle Staff Events
 */
const handleStaffEvent = (eventType, staffData) => {
    const getIO = require("../config/websocketConfig").getIO;
    const io = getIO();
    if (!io) return;

    io.emit(eventType, staffData);

    // Notify Admins
    emitNotificationToAdmins({
        type: "staff",
        message: `Staff event: ${eventType} - ${staffData.name || staffData.staffId}`,
        timestamp: Date.now(),
    });

    emitDashboardMetricsUpdate();
};

/**
 * 🛡️ Rate Limiter for Socket Events
 */
const rateLimit = (maxCalls, perSeconds, callback) => {
    return (...args) => {
        const userId = args[0]?.userId || args[0]?.receiverId || args[0]?.id;
        if (!userId) return;

        const now = Date.now();
        const windowStart = now - perSeconds * 1000;

        if (!callCounts.has(userId)) callCounts.set(userId, []);

        const timestamps = callCounts.get(userId).filter(ts => ts > windowStart);
        timestamps.push(now);

        if (timestamps.length > maxCalls) return;

        callCounts.set(userId, timestamps);
        callback(...args);
    };
};

/**
 * ✅ Prevent Memory Leaks: Clear old timestamps periodically
 */
setInterval(() => {
    const now = Date.now();
    callCounts.forEach((timestamps, userId) => {
        callCounts.set(userId, timestamps.filter(ts => now - ts < 60000));
    });
}, 60000);

/**
 * ✅ Helper Function: Attach WebSocket Module
 */
const attachWebSocketModule = (name, module, io, emitDashboardMetricsUpdate = null) => {
    if (typeof module === "function") {
        module(io, emitDashboardMetricsUpdate);
    } else {
        console.error(`❌ WebSocket Module "${name}" is not a function!`);
    }
};

module.exports = {
    handleSocketEvents,
    emitNotification,
    emitNotificationToAdmins,
    emitDashboardMetricsUpdate,
    emitTaskReportUpdate,
};
