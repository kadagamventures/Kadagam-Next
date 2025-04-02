const { Server } = require("socket.io");

let io;

const initializeWebSocket = (server) => {
    if (io) {
        console.warn("[WebSocket] Already initialized. Restarting...");
        io.close(); 
        io = null; 
    }

    try {
        io = new Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:5173",
                methods: ["GET", "POST"],
                credentials: true,
            },
            transports: ["websocket", "polling"],
            pingInterval: 25000, 
            pingTimeout: 10000, 
        });

        console.log("[WebSocket] Server Initialized");

        io.on("connection", (socket) => {
            console.log(`[WebSocket] New Connection: ${socket.id}`);

            // WebSocket Heartbeat Mechanism
            socket.on("ping", (msg) => {
                socket.emit("pong", "heartbeat-ack");
            });

            socket.on("disconnect", (reason) => {
                console.warn(`[WebSocket] Disconnected (${reason}): ${socket.id}`);
            });

            socket.on("error", (err) => {
                console.error(`[WebSocket] Error: ${err.message}`);
            });
        });

        return io;
    } catch (error) {
        console.error("[WebSocket] Initialization failed:", error.message);
        io = null;
    }
};

const getIO = () => {
    if (!io) {
        throw new Error("[WebSocket] Not initialized! Ensure `initializeWebSocket(server)` is called.");
    }
    return io;
};

module.exports = { initializeWebSocket, getIO };
