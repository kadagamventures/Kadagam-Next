/**
 * ✅ WebSocket Events for Real-Time Leave Management.
 * Handles leave requests, approvals, rejections, and updates.
 */
let dashboardUpdateCooldown = false; // Cooldown to prevent excessive updates

const leaveWebSocket = (io) => {
    const leaveNamespace = io.of("/leaves"); // ✅ WebSocket Namespace for Leave Events

    leaveNamespace.on("connection", (socket) => {
        console.log(`✅ Leave WebSocket Connected: ${socket.id}`);

        /**
         * 📌 Leave Requested (Includes Staff Name)
         */
        socket.on("leaveRequested", ({ userId, staffName, leaveRequest }) => {
            if (!isValidLeavePayload(userId, staffName, leaveRequest)) {
                return emitError(socket, "Invalid leaveRequested event: Missing or invalid fields");
            }

            console.log(`📅 Leave Requested | User: ${staffName} (${userId}) | Request:`, leaveRequest);
            emitLeaveEvent("leaveRequested", { userId, staffName, leaveRequest });
        });

        /**
         * ✅ Leave Approved (Includes Staff Name)
         */
        socket.on("leaveApproved", ({ userId, staffName, leaveDetails }) => {
            if (!isValidLeavePayload(userId, staffName, leaveDetails)) {
                return emitError(socket, "Invalid leaveApproved event: Missing or invalid fields");
            }

            console.log(`✅ Leave Approved | User: ${staffName} (${userId}) | Details:`, leaveDetails);
            emitLeaveEvent("leaveApproved", { userId, staffName, leaveDetails });
        });

        /**
         * ❌ Leave Rejected (Includes Staff Name)
         */
        socket.on("leaveRejected", ({ userId, staffName, reason }) => {
            if (!userId || typeof userId !== "string" || !staffName || !reason) {
                return emitError(socket, "Invalid leaveRejected event: Missing or invalid fields");
            }

            console.log(`❌ Leave Rejected | User: ${staffName} (${userId}) | Reason: ${reason}`);
            emitLeaveEvent("leaveRejected", { userId, staffName, reason });
        });

        /**
         * 🔄 Leave Updated (Includes Staff Name)
         */
        socket.on("leaveUpdated", ({ userId, staffName, leaveDetails }) => {
            if (!isValidLeavePayload(userId, staffName, leaveDetails)) {
                return emitError(socket, "Invalid leaveUpdated event: Missing or invalid fields");
            }

            console.log(`🔄 Leave Updated | User: ${staffName} (${userId}) | Details:`, leaveDetails);
            emitLeaveEvent("leaveUpdated", { userId, staffName, leaveDetails });
        });

        /**
         * ❌ Leave Canceled (New Event)
         */
        socket.on("leaveCanceled", ({ userId, staffName, leaveId }) => {
            if (!userId || typeof userId !== "string" || !staffName || !leaveId) {
                return emitError(socket, "Invalid leaveCanceled event: Missing or invalid fields");
            }

            console.log(`🚫 Leave Canceled | User: ${staffName} (${userId}) | Leave ID: ${leaveId}`);
            emitLeaveEvent("leaveCanceled", { userId, staffName, leaveId });
        });

        /**
         * 🛑 Handle WebSocket Disconnection
         */
        socket.on("disconnect", () => {
            console.log(`❌ Leave WebSocket Disconnected: ${socket.id}`);
        });

        /**
         * ⚠️ Handle WebSocket Errors
         */
        socket.on("error", (err) => {
            console.error(`❌ Leave WebSocket Error: ${err.stack}`);
        });
    });

    /**
     * 🔄 Helper: Emit Leave Event and Update Dashboard
     */
    const emitLeaveEvent = (eventName, payload) => {
        leaveNamespace.emit(eventName, payload);
        updateDashboard();
    };
};

/**
 * 🔄 Prevent Frequent Dashboard Updates (Cooldown Mechanism)
 */
const updateDashboard = async () => {
    if (dashboardUpdateCooldown) return;

    try {
        // ✅ Lazy-load to prevent circular dependency issues
        const { emitDashboardMetricsUpdate } = require("../services/websocketService");
        emitDashboardMetricsUpdate();
    } catch (err) {
        console.error("❌ Error updating dashboard metrics:", err.stack);
    }

    // Set cooldown to avoid excessive updates
    dashboardUpdateCooldown = true;
    setTimeout(() => {
        dashboardUpdateCooldown = false;
    }, 5000);
};

/**
 * 🔎 Helper: Validate Leave Payload
 */
const isValidLeavePayload = (userId, staffName, details) => {
    return userId && typeof userId === "string" && staffName && details;
};

/**
 * ❌ Helper: Emit Error Message to Client
 */
const emitError = (socket, message) => {
    console.warn(`⚠️ ${message}`);
    socket.emit("error", { message });
};

module.exports = leaveWebSocket;
