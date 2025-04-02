const activeUsers = new Map(); // Track connected users

const projectWebSocket = (io) => {
    const projectNamespace = io.of("/projects"); // ✅ WebSocket Namespace for Project Events

    projectNamespace.on("connection", (socket) => {
        console.log(`✅ Project WebSocket Connected: ${socket.id}`);

        /**
         * 🏢 Join Project Room (For Staff Assigned to the Project)
         */
        socket.on("joinProject", (projectId) => {
            if (!projectId || typeof projectId !== "string") {
                return socket.emit("error", { message: "Invalid projectId" });
            }

            socket.join(projectId);
            console.log(`📌 User joined project room: ${projectId}`);
        });

        /**
         * 📌 Project Created (Broadcast to All Users)
         */
        socket.on("projectCreated", async (project) => {
            try {
                if (!project || !project._id) {
                    return socket.emit("error", { message: "Invalid project data" });
                }

                console.log("🆕 Project Created:", project);
                projectNamespace.emit("projectCreated", project);

                // ✅ Lazy-load to prevent circular dependency
                const { emitDashboardMetricsUpdate } = require("../services/websocketService");
                emitDashboardMetricsUpdate();
            } catch (err) {
                console.error("❌ Error in projectCreated event:", err.stack);
                socket.emit("error", { message: "Failed to create project", error: err.message });
            }
        });

        /**
         * ✏️ Project Updated (Broadcast to Assigned Users)
         */
        socket.on("projectUpdated", async (project) => {
            try {
                if (!project || !project._id) {
                    return socket.emit("error", { message: "Invalid project data" });
                }

                console.log("🔄 Project Updated:", project);
                projectNamespace.to(project._id.toString()).emit("projectUpdated", project);

                // ✅ Lazy-load to prevent circular dependency
                const { emitDashboardMetricsUpdate } = require("../services/websocketService");
                emitDashboardMetricsUpdate();
            } catch (err) {
                console.error("❌ Error in projectUpdated event:", err.stack);
                socket.emit("error", { message: "Failed to update project", error: err.message });
            }
        });

        /**
         * ❌ Project Deleted (Broadcast to All Users)
         */
        socket.on("projectDeleted", async ({ projectId }) => {
            try {
                if (!projectId || typeof projectId !== "string") {
                    return socket.emit("error", { message: "Invalid projectId" });
                }

                console.log("🗑 Project Deleted:", projectId);
                projectNamespace.emit("projectDeleted", { projectId });

                // ✅ Lazy-load to prevent circular dependency
                const { emitDashboardMetricsUpdate } = require("../services/websocketService");
                emitDashboardMetricsUpdate();
            } catch (err) {
                console.error("❌ Error in projectDeleted event:", err.stack);
                socket.emit("error", { message: "Failed to delete project", error: err.message });
            }
        });

        /**
         * ❌ Handle WebSocket Disconnection
         */
        socket.on("disconnect", () => {
            console.log(`❌ Project WebSocket Disconnected: ${socket.id}`);
        });

        /**
         * ⚠️ Handle WebSocket Errors
         */
        socket.on("error", (err) => {
            console.error(`❌ Project WebSocket Error: ${err.stack}`);
            socket.emit("error", { message: "WebSocket error occurred", error: err.message });
        });
    });
};

module.exports = projectWebSocket;
