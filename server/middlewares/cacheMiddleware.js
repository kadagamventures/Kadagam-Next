const { redisClient } = require("../config/redisConfig");

const DEFAULT_CACHE_TTL = parseInt(process.env.CACHE_TTL, 10) || 3600;
const ROUTE_CACHE_TTL = {
    "/api/reports": 86400, // Cache reports for 1 day
    "/api/tasks": 1800, // Cache tasks for 30 minutes
};

const cacheMiddleware = async (req, res, next) => {
    if (req.method !== "GET" || req.query.noCache === "true") {
        return next(); // Only cache GET requests unless bypassed
    }

    const cacheKey = `cache:${req.originalUrl}`;
    const cacheTTL = ROUTE_CACHE_TTL[req.originalUrl] || DEFAULT_CACHE_TTL;

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            if (process.env.NODE_ENV !== "production") {
                console.log(`[Cache Hit] ${cacheKey}`);
            }
            return res.json(JSON.parse(cachedData));
        }

        if (process.env.NODE_ENV !== "production") {
            console.log(`[Cache Miss] ${cacheKey}`);
        }

        // Override res.json to store the response in cache
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            if (res.statusCode === 200) { // Cache only successful responses
                redisClient.setEx(cacheKey, cacheTTL, JSON.stringify(data)).catch((err) => {
                    console.error("[Cache Error]: Failed to set cache:", err);
                });
            }
            originalJson(data);
        };

        next();
    } catch (error) {
        console.error("[Redis Middleware Error]:", error);
        next(); // Gracefully proceed if Redis fails
    }
};

module.exports = { cacheMiddleware };
