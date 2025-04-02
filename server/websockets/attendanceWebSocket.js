/**
 * ✅ WebSocket Events for Real-Time Attendance Management.
 * Handles staff check-in, check-out, and leave status changes.
 */
const activeUsers = new Map(); // Track connected users
let dashboardUpdateCooldown = false; // Prevent excessive updates

const attendanceWebSocket = (io, emitDashboardMetricsUpdate) => {
    const attendanceNamespace = io.of("/attendance"); // ✅ WebSocket Namespace for Attendance Events

    attendanceNamespace.on("connection", (socket) => {
        console.log(`✅ Attendance WebSocket Connected: ${socket.id}`);

        /**
         * ⏳ Staff Check-In Event (Includes Staff Name)
         */
        socket.on("attendanceCheckIn", ({ userId, staffName, status }) => {
            if (!userId || typeof userId !== "string" || !staffName || !status) {
                return console.warn("⚠️ Invalid attendanceCheckIn event: Missing or invalid fields");
            }

            console.log(`⏳ Check-in | Staff: ${staffName} (${userId}) | Status: ${status}`);
            attendanceNamespace.emit("attendanceCheckIn", { userId, staffName, status });
            updateDashboard(emitDashboardMetricsUpdate);
        });

        /**
         * ✅ Staff Check-Out Event (Includes Staff Name)
         */
        socket.on("attendanceCheckOut", ({ userId, staffName, status }) => {
            if (!userId || typeof userId !== "string" || !staffName || !status) {
                return console.warn("⚠️ Invalid attendanceCheckOut event: Missing or invalid fields");
            }

            console.log(`✅ Check-out | Staff: ${staffName} (${userId}) | Status: ${status}`);
            attendanceNamespace.emit("attendanceCheckOut", { userId, staffName, status });
            updateDashboard(emitDashboardMetricsUpdate);
        });

        /**
         * 🔄 General Attendance Update (Single Emission Prevented)
         */
        socket.on("attendanceUpdate", ({ userId, staffName, status }) => {
            if (!userId || typeof userId !== "string" || !staffName || !status) {
                return console.warn("⚠️ Invalid attendanceUpdate event: Missing or invalid fields");
            }

            console.log(`🔄 Attendance Update | Staff: ${staffName} (${userId}) | Status: ${status}`);
            attendanceNamespace.emit("attendanceUpdated", { userId, staffName, status });
            updateDashboard(emitDashboardMetricsUpdate);
        });

        /**
         * ❌ Handle WebSocket Disconnection.
         */
        socket.on("disconnect", () => {
            console.log(`❌ Attendance WebSocket Disconnected: ${socket.id}`);
        });

        /**
         * ⚠️ WebSocket Error Handling - Log critical errors.
         */
        socket.on("error", (err) => {
            console.error(`❌ Attendance WebSocket Error: ${err.stack}`);
        });
    });
};

/**
 * 🔄 Prevent Frequent Dashboard Updates (Cooldown Mechanism)
 */
const updateDashboard = (emitDashboardMetricsUpdate) => {
    if (dashboardUpdateCooldown) return;

    try {
        emitDashboardMetricsUpdate();
    } catch (err) {
        console.error("❌ Error updating dashboard metrics:", err.stack);
    }

    dashboardUpdateCooldown = true;
    setTimeout(() => {
        dashboardUpdateCooldown = false;
    }, 5000);
};

module.exports = attendanceWebSocket;
