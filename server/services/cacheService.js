// services/cacheService.js
const { redisClient } = require("../config/redisConfig");

const CACHE_TTL = process.env.CACHE_TTL || 600; // 10 minutes

const setCache = async (key, data, ttl = CACHE_TTL) => {
    try {
        const value = JSON.stringify(data);
        await redisClient.setEx(key, ttl, value);
    } catch (err) {
        console.error(`❌ Error setting Redis cache for key: ${key}`, err);
    }
};

const getCache = async (key) => {
    try {
        const cachedData = await redisClient.get(key);
        return cachedData ? JSON.parse(cachedData) : null;
    } catch (err) {
        console.error(`❌ Error getting Redis cache for key: ${key}`, err);
        return null; // Graceful fallback
    }
};

const deleteCache = async (key) => {
    try {
        await redisClient.del(key);
    } catch (err) {
        console.error(`❌ Error deleting Redis cache for key: ${key}`, err);
    }
};

const clearCache = async () => {
    console.warn("⚠️ clearCache() in Redis would require caution (usually with namespaces). Consider using a safer strategy.");
    // Redis typically doesn't support flush per-namespace directly; you may need to loop through keys by pattern.
};

module.exports = { setCache, getCache, deleteCache, clearCache };
