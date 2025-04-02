const User = require("../models/User");
const userService = require("../services/userService");
const fileService = require("../services/fileService");
const emailService = require("../services/emailService");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const tokenUtils = require("../utils/tokenUtils");

// ✅ CREATE NEW STAFF
const addStaff = asyncHandler(async (req, res) => {
    console.log("Received req.body:", req.body);

    let { name, email, role, salary, phone, assignedProjects, permissions = [], assignedTeam, staffId } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and Email are required." });

    // ✅ Safe parse if stringified
    assignedProjects = typeof assignedProjects === "string" ? JSON.parse(assignedProjects || "[]") : assignedProjects;
    permissions = typeof permissions === "string" ? JSON.parse(permissions || "[]") : permissions;

    // ✅ Uniqueness checks
    if (await userService.getStaffByEmail(email)) {
        return res.status(400).json({ message: "Email is already in use." });
    }

    const finalStaffId = staffId?.trim() || await userService.generateUniqueStaffId();
    if (await userService.isStaffIdTaken(finalStaffId)) {
        return res.status(400).json({
            message: "Staff ID is already taken.",
            suggestedId: await userService.generateUniqueStaffId()
        });
    }

    // ✅ Generate and hash password
    const rawPassword = userService.generateSecurePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // ✅ File handling
    let profilePicUrl = "", resumeUrl = "";
    if (req.files) {
        const profilePicFile = req.files.find(file => file.fieldname === "profilePic");
        const resumeFile = req.files.find(file => file.fieldname === "resume");
        if (profilePicFile) profilePicUrl = await fileService.uploadFile(profilePicFile);
        if (resumeFile) resumeUrl = await fileService.uploadFile(resumeFile);
    }

    try {
        // ✅ Create staff
        const staff = await userService.createStaff({
            name,
            email,
            role,
            team: assignedTeam || null,
            staffId: finalStaffId,
            password: hashedPassword,
            salary,
            phone,
            assignedProjects,
            permissions,
            profilePic: profilePicUrl,
            resume: resumeUrl
        });

        // ✅ Send Email (wrap to avoid failure)
        try {
            await emailService.sendEmail(
                email,
                "Your Nithya Task Manager Credentials",
                "",
                `
                    <p>Hello ${name},</p>
                    <p>Your Staff ID: <strong>${finalStaffId}</strong></p>
                    <p>Your Password: <strong>${rawPassword}</strong></p>
                    <p>Please login and change your password if needed.</p>
                `
            );
        } catch (emailErr) {
            console.error(`❌ Email to ${email} failed:`, emailErr.message);
        }

        // ✅ Respond with staff and raw password for admin
        res.status(201).json({
            success: true,
            message: "Staff created successfully",
            staff,
            rawPassword
        });

    } catch (error) {
        console.error("❌ Error creating staff:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

// ✅ UPDATE STAFF INFO
const updateStaff = asyncHandler(async (req, res) => {
    const { email, staffId, permissions } = req.body;

    // Check if email is already taken by another user
    if (email) {
        const existingUser = await userService.getStaffByEmail(email);
        // Allow update if the found user is the same as the current one
        if (existingUser && existingUser._id.toString() !== req.params.id) {
            return res.status(400).json({ message: "Email is already in use. Please use a different email." });
        }
    }

    // Check if staffId is already taken by another user
    if (staffId) {
        // Find a user with the given staffId using the imported User model
        const existingStaff = await User.findOne({ staffId });
        if (existingStaff && existingStaff._id.toString() !== req.params.id) {
            return res.status(400).json({ message: "Staff ID is already taken." });
        }
    }

    // Update staff details
    const updatedStaff = await userService.updateStaff(req.params.id, req.body);
    if (!updatedStaff) {
        return res.status(404).json({ message: "Staff not found" });
    }

    // If permissions changed, force re-login by blacklisting tokens
    if (permissions) {
        await tokenUtils.blacklistUserTokens(updatedStaff._id);
    }

    // Fetch updated staff list after successful update
    const staffList = await userService.getAllStaff();

    // Send response with updated staff and refreshed staff list
    res.status(200).json({
        success: true,
        updatedStaff,
        staffList,
        message: "Staff updated successfully. Re-login required for permission changes."
    });
});

// ✅ DELETE STAFF
const deleteStaff = asyncHandler(async (req, res) => {
    const result = await userService.deleteStaff(req.params.id);
    if (!result) return res.status(404).json({ message: "Failed to delete staff or staff not found" });
    res.status(200).json({ success: true, message: "Staff deleted successfully" });
});

// ✅ FETCH ALL STAFF
const getAllStaff = asyncHandler(async (req, res) => {
    const staffList = await userService.getAllStaff();
    res.status(200).json({ success: true, staffList });
});

// ✅ FETCH STAFF BY ID
const getStaffById = asyncHandler(async (req, res) => {
    const staff = await userService.getStaffById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.status(200).json({ success: true, staff });
});

// ✅ FETCH STAFF BY EMAIL
const getStaffByEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const staff = await userService.getStaffByEmail(email);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.status(200).json({ success: true, staff });
});

// ✅ FETCH USER PROFILE
const getUserProfile = asyncHandler(async (req, res) => {
    const staff = await userService.getStaffById(req.params.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.status(200).json({ success: true, staff });
});

// ✅ FETCH STAFF FORM DATA
const getStaffFormData = asyncHandler(async (req, res) => {
    const projects = await userService.getAvailableProjects();
    const teams = await userService.getAvailableTeams();
    res.status(200).json({ projects, teams });
});

// ✅ FETCH LOGGED-IN STAFF PROFILE
const getMyProfile = asyncHandler(async (req, res) => {
    const staff = await userService.getStaffById(req.user.id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    res.status(200).json({ success: true, staff });
});

// ✅ CHECK STAFF ID
const checkStaffId = asyncHandler(async (req, res) => {
    const { staffId } = req.query;
    if (await userService.isStaffIdTaken(staffId)) {
        return res.status(400).json({ valid: false, message: "Staff ID is already taken." });
    }
    res.status(200).json({ valid: true, message: "Staff ID is available" });
});

// ✅ UPLOAD PROFILE PIC
const uploadStaffProfilePic = asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const updatedStaff = await userService.updateStaffProfilePic(req.params.id, req.file.location || req.file.path);
    if (!updatedStaff) return res.status(404).json({ message: "Staff not found" });
    res.status(200).json({ success: true, updatedStaff });
});

// ✅ UPLOAD RESUME
const uploadStaffResume = asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const updatedStaff = await userService.updateStaffResume(req.params.id, req.file.location || req.file.path);
    if (!updatedStaff) return res.status(404).json({ message: "Staff not found" });
    res.status(200).json({ success: true, updatedStaff });
});

// ✅ EXPORT CONTROLLER
module.exports = {
    addStaff,
    getAllStaff,
    getStaffById,
    getStaffByEmail,
    getUserProfile,
    updateStaff,
    deleteStaff,
    uploadStaffProfilePic,
    uploadStaffResume,
    checkStaffId,
    getMyProfile,
    getStaffFormData,
};
