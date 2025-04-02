const jwt = require("jsonwebtoken");
const { redisClient } = require("../config/redisConfig"); // Ensure Redis is properly configured
require("dotenv").config();

// ✅ Ensure JWT_SECRET is set at runtime
if (!process.env.JWT_SECRET) {
    throw new Error("❌ JWT_SECRET is not set in the environment variables!");
}

// Token Expiry Defaults (Use .env or fallback values)
const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRES || "1h";  // Short expiry for security
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES || "7d"; // Longer expiry for refresh tokens
const RESET_TOKEN_EXPIRY = process.env.JWT_RESET_EXPIRES || "15m";  // Short-lived reset token

const tokenUtils = {
    /**
     * ✅ Generate JWT Token (Reusable for Access, Refresh, and Reset)
     */
    generateToken: (payload, expiresIn) => {
        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
    },

    /**
     * ✅ Verify JWT Token
     * Returns decoded payload if valid, otherwise null.
     */
    verifyToken: (token) => {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            console.error("❌ Invalid token:", error.message);
            return null;
        }
    },

    /**
     * ✅ Generate Access Token (Short-lived for security)
     */
    generateAccessToken: (user) => {
        return tokenUtils.generateToken(
            { id: user._id, role: user.role },
            ACCESS_TOKEN_EXPIRY
        );
    },

    /**
     * ✅ Generate Refresh Token (Longer-lived)
     */
    generateRefreshToken: (user) => {
        return tokenUtils.generateToken(
            { id: user._id, role: user.role },
            REFRESH_TOKEN_EXPIRY
        );
    },

    /**
     * ✅ Generate Reset Token (For Password Reset - Short-lived)
     */
    generateResetToken: (userId) => {
        return tokenUtils.generateToken(
            { id: userId },
            RESET_TOKEN_EXPIRY
        );
    },

    /**
     * ✅ Verify Access Token
     */
    verifyAccessToken: (token) => tokenUtils.verifyToken(token),

    /**
     * ✅ Verify Refresh Token
     */
    verifyRefreshToken: (token) => tokenUtils.verifyToken(token),

    /**
     * ✅ Verify Reset Token (Returns User ID if valid)
     */
    verifyResetToken: (token) => {
        const decoded = tokenUtils.verifyToken(token);
        return decoded ? decoded.id : null;
    },

    /**
     * ✅ Check if a Token is Blacklisted (Revoked)
     */
    isTokenBlacklisted: async (token) => {
        try {
            const exists = await redisClient.get(`blacklist:${token}`);
            return !!exists; // Returns true if token is blacklisted
        } catch (error) {
            console.error("❌ Redis Error Checking Token Blacklist:", error);
            return false;
        }
    },

    /**
     * ✅ Blacklist Token (Used for Logout)
     */
    blacklistToken: async (token, expirySeconds = 3600) => {
        try {
            await redisClient.set(`blacklist:${token}`, "revoked", { EX: expirySeconds });
        } catch (error) {
            console.error("❌ Redis Error Blacklisting Token:", error);
        }
    },

    /**
     * ✅ Middleware: Check if Access Token is Valid and Not Blacklisted
     */
    authenticateToken: async (req, res, next) => {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "❌ Unauthorized: No token provided!" });
        }

        // Check if token is blacklisted (logged out)
        const isBlacklisted = await tokenUtils.isTokenBlacklisted(token);
        if (isBlacklisted) {
            return res.status(403).json({ message: "❌ Token has been revoked! Please login again." });
        }

        // Verify token
        const decoded = tokenUtils.verifyAccessToken(token);
        if (!decoded) {
            return res.status(403).json({ message: "❌ Invalid or expired token!" });
        }

        req.user = decoded; // Attach decoded user info to request
        next();
    },

    /**
     * ✅ Middleware: Verify Refresh Token (For Token Refresh)
     */
    authenticateRefreshToken: async (req, res, next) => {
        const token = req.body.refreshToken;

        if (!token) {
            return res.status(401).json({ message: "❌ Unauthorized: No refresh token provided!" });
        }

        // Check if refresh token is blacklisted
        const isBlacklisted = await tokenUtils.isTokenBlacklisted(token);
        if (isBlacklisted) {
            return res.status(403).json({ message: "❌ Refresh token has been revoked!" });
        }

        // Verify token
        const decoded = tokenUtils.verifyRefreshToken(token);
        if (!decoded) {
            return res.status(403).json({ message: "❌ Invalid or expired refresh token!" });
        }

        req.user = decoded; // Attach decoded user info to request
        next();
    },

    /**
     * ✅ Logout User: Blacklist Refresh and Access Tokens
     */
    logoutUser: async (accessToken, refreshToken) => {
        try {
            if (accessToken) {
                const accessDecoded = tokenUtils.verifyAccessToken(accessToken);
                if (accessDecoded) {
                    await tokenUtils.blacklistToken(accessToken, 3600); // Blacklist for 1 hour
                }
            }

            if (refreshToken) {
                const refreshDecoded = tokenUtils.verifyRefreshToken(refreshToken);
                if (refreshDecoded) {
                    await tokenUtils.blacklistToken(refreshToken, 604800); // Blacklist for 7 days
                }
            }

            return true;
        } catch (error) {
            console.error("❌ Logout Error:", error);
            return false;
        }
    }
};

module.exports = tokenUtils;
