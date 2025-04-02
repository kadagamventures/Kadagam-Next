const User = require("../models/User");
const Task = require("../models/Task");
const bcrypt = require("bcryptjs");
const fileService = require("./fileService");
const emailService = require("./emailService");
const crypto = require("crypto");

// ✅ Extract file key from S3 URL
const extractFileKey = (url) => {
    if (!url) return null;
    try {
        const match = url.match(/\/([^/]+\/[^/]+)$/);
        return match ? match[1] : null;
    } catch (error) {
        console.error("❌ Error extracting file key:", error);
        return null;
    }
};

const allPermissions = ["manage_staff", "manage_project", "manage_task"];
const permissionMap = {
    "All Permission": allPermissions,
    "manage_task": ["manage_task"],
    "manage_staff": ["manage_staff"],
    "manage_project": ["manage_project"],
    "No Permission": []
};

class UserService {
    // ✅ Generate unique 4-digit staff ID
    static async generateUniqueStaffId() {
        let staffId, exists;
        do {
            staffId = `${Math.floor(1000 + Math.random() * 9000)}`;
            exists = await User.exists({ staffId });  // No need to filter isDeleted
        } while (exists);
        return staffId;
    }

    // ✅ Check if staffId is taken (No isDeleted filter - UNIQUE INDEX cares for all)
    static async isStaffIdTaken(staffId) {
        return await User.exists({ staffId });
    }

    // ✅ Generate a secure 8-character password
    static generateSecurePassword() {
        return crypto.randomBytes(4).toString("hex").toUpperCase();  // Example: 7D510930
    }

    // ✅ Normalize Permissions
    static normalizePermissions(permissions) {
        if (!Array.isArray(permissions) || permissions.length === 0) return [];
        if (permissions.includes("All Permission")) return [...new Set(allPermissions)];
        if (permissions.includes("No Permission")) return [];
        return [...new Set(permissions.flatMap(p => permissionMap[p] || []))];
    }

    // ✅ Create a new staff user
    static async createStaff({ name, email, role, staffId, password, salary, phone, assignedProjects, profilePic, resume, permissions, assignedTeam }) {
        // Final check for duplicate Staff ID
        if (await this.isStaffIdTaken(staffId)) throw new Error("Staff ID is already taken.");

        // If password is already hashed (from outside), skip hashing again
        const hashedPassword = password.length === 60 ? password : await bcrypt.hash(password, 10);
        const mappedPermissions = UserService.normalizePermissions(permissions);

        const newUser = new User({
            name,
            email,
            role,
            staffId,
            password: hashedPassword,
            salary,
            phone,
            assignedProjects,
            profilePic: profilePic || null,
            resume: resume || null,
            permissions: mappedPermissions,
            team: assignedTeam || null
        });

        await newUser.save();
        return newUser;
    }

    // ✅ Get all active staff (Exclude passwords)
    static async getAllStaff() {
        return await User.find({ isDeleted: false })
            .select("-password")
            .populate("assignedProjects", "name description")
            .lean();
    }

    static async getActiveStaffForDropdown() {
        return await User.find({ isActive: true, isDeleted: false })
            .select("_id name email role")
            .lean();
    }

    static async getStaffById(id) {
        return await User.findOne({ _id: id, isDeleted: false })
            .populate("assignedProjects", "name description")
            .select("-password");
    }

    static async getStaffByEmail(email) {
        return await User.findOne({ email, isDeleted: false })
            .select("-password")
            .populate("assignedProjects", "name description");
    }

    static async getMyProfile(id) {
        const staff = await User.findById(id)
            .select("name email phone role salary staffId profilePic assignedProjects")
            .populate("assignedProjects", "name description");

        if (!staff) return null;

        return {
            name: staff.name,
            email: staff.email,
            phone: staff.phone,
            role: staff.role,
            salary: staff.salary,
            staffId: staff.staffId,
            profilePic: staff.profilePic || "https://your-default-image-url.com/default.jpg",
            assignedProjects: staff.assignedProjects
        };
    }

    // ✅ Update staff data with optional password hashing
    static async updateStaff(id, updateData) {
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }
        if (updateData.permissions) {
            updateData.permissions = UserService.normalizePermissions(updateData.permissions);
        }
        return await User.findByIdAndUpdate(
            id,
            { $set: { ...updateData, team: updateData.team || updateData.assignedTeam || null } },
            { new: true }
        ).select("-password");
    }

    // ✅ Delete staff after checking for active tasks
    static async deleteStaff(id) {
        const staff = await User.findById(id);
        if (!staff || staff.isDeleted) return null;

        const hasActiveTasks = await Task.exists({ assignedTo: staff._id, status: { $ne: "Completed" } });
        if (hasActiveTasks) throw new Error("Cannot delete staff with active tasks.");

        staff.isDeleted = true;
        await staff.save();
        await this.deleteStaffFiles(staff.profilePic, staff.resume);

        return staff;
    }

    // ✅ Delete S3 files if needed
    static async deleteStaffFiles(profilePic, resume) {
        try {
            if (profilePic) {
                const profilePicKey = extractFileKey(profilePic);
                if (profilePicKey) await fileService.deleteFile(profilePicKey);
            }
            if (resume) {
                const resumeKey = extractFileKey(resume);
                if (resumeKey) await fileService.deleteFile(resumeKey);
            }
        } catch (error) {
            console.error("❌ File deletion error:", error.message);
        }
    }

    static async updateStaffProfilePic(id, profilePicUrl) {
        const staff = await User.findById(id);
        if (!staff) throw new Error("Staff not found.");
        await this.deleteStaffFiles(staff.profilePic, null);
        staff.profilePic = profilePicUrl;
        await staff.save();
        return staff;
    }

    static async updateStaffResume(id, resumeUrl) {
        const staff = await User.findById(id);
        if (!staff) throw new Error("Staff not found.");
        await this.deleteStaffFiles(null, staff.resume);
        staff.resume = resumeUrl;
        await staff.save();
        return staff;
    }

    // ✅ Dummy methods to fetch projects and teams
    static async getAvailableProjects() {
        return [
            { _id: "1", name: "Project A" },
            { _id: "2", name: "Project B" }
        ];
    }

    static async getAvailableTeams() {
        return ["Team A", "Team B", "Team C"];
    }
}

module.exports = UserService;
