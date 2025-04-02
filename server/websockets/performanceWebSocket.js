const performanceService = require("../services/performanceService");

const performanceWebSocket = (io) => {
    const performanceNamespace = io.of("/performance"); // ✅ WebSocket namespace for performance events

    performanceNamespace.on("connection", (socket) => {
        console.log(`✅ Performance WebSocket Connected: ${socket.id}`);

        /**
         * 📊 Admin requests live performance summary (Dashboard Updates)
         */
        socket.on("requestPerformanceSummary", async () => {
            try {
                const summary = await performanceService.getLivePerformanceSummary();
                socket.emit("performanceSummary", summary);
            } catch (error) {
                handleError(socket, "Failed to fetch performance data.", error);
            }
        });

        /**
         * 🔄 Update Performance Data (Triggered when reports are generated)
         */
        socket.on("performanceUpdated", async ({ month, year }) => {
            if (!isValidPerformanceUpdatePayload(month, year)) {
                return emitError(socket, "Invalid performanceUpdated event: Missing or invalid month/year.");
            }

            try {
                console.log(`🔄 Performance Updated for ${month}/${year}`);
                const summary = await performanceService.getLivePerformanceSummary();
                performanceNamespace.emit("performanceSummary", summary); // ✅ Broadcast within namespace

                // ✅ Lazy-load to prevent circular dependency issues
                try {
                    const { emitDashboardUpdate } = require("../services/websocketService");
                    emitDashboardUpdate(performanceNamespace, "performance"); // ✅ Ensures dashboard consistency
                } catch (dashboardError) {
                    console.error("❌ Error updating admin dashboard:", dashboardError.stack);
                }
            } catch (error) {
                handleError(socket, "Failed to update performance data.", error);
            }
        });

        /**
         * 🔔 Notify staff when their performance report is available
         */
        socket.on("performanceReportGenerated", ({ staffId, reportUrl }) => {
            if (!isValidPerformanceReportPayload(staffId, reportUrl)) {
                return emitError(socket, "Invalid performance report event: Missing or invalid staffId/reportUrl.");
            }

            console.log(`📂 Performance Report Generated | Staff: ${staffId} | Report: ${reportUrl}`);
            performanceNamespace.to(staffId).emit("performanceReportReady", { reportUrl });
        });

        /**
         * 🛑 Handle Disconnect
         */
        socket.on("disconnect", () => {
            console.log(`❌ Performance WebSocket Disconnected: ${socket.id}`);
        });

        /**
         * ⚠️ Handle WebSocket Errors
         */
        socket.on("error", (err) => {
            console.error(`❌ Performance WebSocket Error: ${err.stack}`);
        });
    });
};

/**
 * 🔎 Helper: Validate Performance Update Payload
 */
const isValidPerformanceUpdatePayload = (month, year) => {
    return month && typeof month === "string" && year && Number.isInteger(year);
};

/**
 * 🔎 Helper: Validate Performance Report Payload
 */
const isValidPerformanceReportPayload = (staffId, reportUrl) => {
    return staffId && typeof staffId === "string" && reportUrl;
};

/**
 * ❌ Helper: Emit Error Message to Client
 */
const emitError = (socket, message) => {
    console.warn(`⚠️ ${message}`);
    socket.emit("error", { message });
};

/**
 * ❌ Helper: Handle Internal Errors
 */
const handleError = (socket, userMessage, error) => {
    console.error(`❌ ${userMessage} Error Details:`, error.stack);
    socket.emit("error", { message: userMessage });
};

module.exports = performanceWebSocket;
