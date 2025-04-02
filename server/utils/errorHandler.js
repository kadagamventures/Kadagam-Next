const mongoose = require("mongoose");

/**
 * ✅ Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
    console.error("❌ Error:", err.message);

    // Handle Mongoose Validation Errors
    if (err instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({
            success: false,
            message: "Validation Error",
            errors: Object.values(err.errors).map((error) => error.message),
        });
    }

    // Handle Mongoose Cast Errors (e.g., Invalid ObjectId)
    if (err instanceof mongoose.Error.CastError) {
        return res.status(400).json({
            success: false,
            message: `Invalid ${err.path}: ${err.value}. Please provide a valid value.`,
        });
    }

    // Handle JWT Authentication Errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token. Please log in again.",
        });
    }

    // Handle Expired JWT Tokens
    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            message: "Session expired. Please log in again.",
        });
    }

    // Handle Duplicate Key Errors (MongoDB unique constraint)
    if (err.code === 11000) {
        return res.status(409).json({
            success: false,
            message: `Duplicate value error. ${Object.keys(err.keyValue)[0]} already exists.`,
        });
    }

    // Handle Missing Required Fields (Manual Validation)
    if (err.message && err.message.includes("required")) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    // Handle Forbidden Access
    if (err.status === 403) {
        return res.status(403).json({
            success: false,
            message: err.message || "You do not have permission to perform this action.",
        });
    }

    // Handle Not Found Errors
    if (err.status === 404) {
        return res.status(404).json({
            success: false,
            message: err.message || "The requested resource was not found.",
        });
    }

    // Handle Rate Limiting Errors (Too Many Requests)
    if (err.status === 429) {
        return res.status(429).json({
            success: false,
            message: "Too many requests. Please try again later.",
        });
    }

    // Internal Server Error (Fallback)
    return res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
};

/**
 * ✅ Handle 404 Not Found Errors (Route Not Found)
 */
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`,
    });
};

module.exports = {
    errorHandler,
    notFoundHandler,
};
