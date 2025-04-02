const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const tokenUtils = require("../utils/tokenUtils");
const emailService = require("../services/emailService");
const asyncHandler = require("express-async-handler");

/**
 * ✅ Admin Login (Staff ID 8000 or Admin Email)
 */
const adminLogin = asyncHandler(async (req, res) => {
    const { loginId, password } = req.body;
    if (!loginId || !password) return res.status(400).json({ message: "Login ID and password are required." });

    const admin = await User.findOne({
        $or: [{ email: loginId, role: "admin" }, { staffId: "8000", role: "admin" }],
        isDeleted: false,
    });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    const accessToken = tokenUtils.generateAccessToken(admin);
    const refreshToken = tokenUtils.generateRefreshToken(admin);

    res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "Strict" });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "Strict" });

    res.json({
        accessToken,
        user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            staffId: admin.staffId,
            role: admin.role,
            permissions: admin.permissions || [],
        },
    });
});

/**
 * ✅ Staff Login - supports raw password saved as bcrypt hash
 */
const staffLogin = asyncHandler(async (req, res) => {
    const { loginId, password } = req.body;
    if (!loginId || !password) return res.status(400).json({ message: "Email/Staff ID and password are required." });

    const user = await User.findOne({
        $or: [{ email: loginId }, { staffId: loginId }],
        isDeleted: false,
    });

    if (!user) return res.status(401).json({ message: "Invalid Staff ID or Email" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid Password" });

    const accessToken = tokenUtils.generateAccessToken(user);
    const refreshToken = tokenUtils.generateRefreshToken(user);

    res.cookie("accessToken", accessToken, { httpOnly: true, secure: true, sameSite: "Strict" });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: "Strict" });

    res.json({
        accessToken,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            staffId: user.staffId,
            role: user.role,
            permissions: user.permissions || [],
        },
    });
});

/**
 * ✅ Refresh Token Flow
 */
const refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    if (await tokenUtils.isTokenBlacklisted(token)) {
        return res.status(403).json({ message: "Refresh token is blacklisted. Please log in again." });
    }

    const decoded = tokenUtils.verifyRefreshToken(token);
    if (!decoded) return res.status(403).json({ message: "Invalid refresh token" });

    const user = await User.findById(decoded.id).select("role permissions isActive");
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "Account is inactive. Contact admin." });

    const newAccessToken = tokenUtils.generateAccessToken(user);
    res.cookie("accessToken", newAccessToken, { httpOnly: true, secure: true, sameSite: "Strict" });

    res.json({ accessToken: newAccessToken });
});

/**
 * ✅ Get Current User Profile
 */
const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
});

/**
 * ✅ Request Password Reset (Token via Email)
 */
const requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = await bcrypt.hash(resetToken, 10);
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    await emailService.sendPasswordResetEmail(user.email, resetToken);
    res.json({ message: "Password reset link sent to email." });
});

/**
 * ✅ Reset Password Using Token
 */
const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: "Token and new password are required." });

    const user = await User.findOne({ resetPasswordExpires: { $gt: Date.now() } });
    if (!user || !(await bcrypt.compare(token, user.resetPasswordToken))) {
        return res.status(400).json({ message: "Invalid or expired token." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await tokenUtils.blacklistUserTokens(user._id); // Invalidate old tokens
    res.json({ message: "Password reset successful. Please log in again." });
});

/**
 * ✅ Logout - Blacklist tokens
 */
const logout = asyncHandler(async (req, res) => {
    await tokenUtils.blacklistUserTokens(req.user.id);
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.json({ message: "Logged out successfully" });
});

/**
 * ✅ Export All Auth Functions
 */
module.exports = {
    adminLogin,
    staffLogin,
    refreshToken,
    getCurrentUser,
    requestPasswordReset,
    resetPassword,
    logout,
};
