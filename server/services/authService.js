const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const tokenUtils = require("../utils/tokenUtils");
require("dotenv").config();

/**
 * ✅ Generate a Secure Password Reset Token
 * - Hashes the token before saving
 * - Valid for 1 hour
 */
const generateResetToken = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    if (user.isDeleted) throw new Error("User is no longer active.");
    if (!user.isActive) throw new Error("User account is inactive. Contact admin.");

    // Reset any previous token
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    return resetToken; // Return plain token for email
};

/**
 * ✅ Authenticate Staff or Admin (Login)
 */
const authenticateUser = async (loginId, password) => {
    const user = await User.findOne({
        $or: [{ email: loginId }, { staffId: loginId }],
        isDeleted: false,
    });

    if (!user) throw new Error("Invalid credentials");
    if (!user.isActive) throw new Error("User account is inactive. Contact admin.");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const token = tokenUtils.generateAccessToken(user);
    return { token, user: user.toObject() };
};

/**
 * ✅ Fetch Current User by ID
 * - Excludes password and sensitive reset tokens
 */
const getUserById = async (id) => {
    const user = await User.findById(id).select("-password -resetPasswordToken -resetPasswordExpires");
    if (!user) throw new Error("User not found");
    return user;
};

/**
 * ✅ Utility to Hash Passwords (Used in Create or Reset)
 */
const hashPassword = async (plainPassword) => {
    const salt = await bcrypt.genSalt(12); // Higher rounds for production
    return await bcrypt.hash(plainPassword, salt);
};

module.exports = {
    authenticateUser,
    getUserById,
    generateResetToken,
    hashPassword,
};
