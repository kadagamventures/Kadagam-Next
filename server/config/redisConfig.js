const redis = require("redis");

let redisClient;

const getRedisClient = () => {
    if (!redisClient) {
        redisClient = redis.createClient({
            socket: {
                host: process.env.REDIS_HOST || "127.0.0.1",
                port: process.env.REDIS_PORT || 6379,
                reconnectStrategy: (retries) => (retries > 5 ? false : Math.min(retries * 200, 5000)), // Exponential backoff
            },
            ...(process.env.REDIS_PASSWORD ? { password: process.env.REDIS_PASSWORD } : {}),
        });

        redisClient.on("error", (err) => {
            console.error("❌ [Redis] Error:", err.message);
        });

        redisClient.on("connect", () => {
            console.log("🟢 [Redis] Connected successfully.");
        });
    }
    return redisClient;
};

/**
 * Connect to Redis (Ensures Readiness Before Usage)
 */
const connectRedis = async () => {
    const client = getRedisClient();
    
    if (client.isOpen || client.status === "connecting") {
        console.log("🟡 [Redis] Already connecting or connected. Skipping...");
        return;
    }

    try {
        console.log("[Redis] Connecting...");
        await client.connect();
        console.log("🟢 [Redis] Connection established.");
    } catch (error) {
        console.error("❌ [Redis] Connection failed:", error.message);
        setTimeout(connectRedis, 5000); // Retry after 5s
    }
};

// Graceful Shutdown Handling
const closeRedis = async () => {
    const client = getRedisClient();
    if (client.isOpen) {
        try {
            await client.quit();
            console.log("🟢 [Redis] Connection closed gracefully.");
        } catch (error) {
            console.error("❌ [Redis] Error while closing:", error.message);
        }
    }
    process.exit(0);
};

process.on("SIGINT", closeRedis);
process.on("SIGTERM", closeRedis);

// Connect Redis (Only If Not Already Connected)
connectRedis();

module.exports = { redisClient: getRedisClient(), connectRedis };
