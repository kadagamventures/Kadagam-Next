const asyncHandler = require("express-async-handler");
const projectService = require("../services/projectService");
const { validationResult } = require("express-validator");

// ✅ Create a new project
const createProject = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const projectData = { ...req.body, createdBy: req.user.id };
        const project = await projectService.createProject(projectData);
        res.status(201).json({ success: true, project });
    } catch (error) {
        console.error("❌ Error creating project:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// ✅ Get all projects (Supports search)
const getAllProjects = asyncHandler(async (req, res) => {
    try {
        const { role, permissions } = req.user;

        // ✅ Allow Admins, `manage_project`, and `manage_task` users to fetch all projects
        if (role === "admin" || permissions.includes("manage_project") || permissions.includes("manage_task")) {
            const projects = await projectService.getAllProjects();
            return res.status(200).json({ success: true, projects });
        }

        // 🚫 Normal staff can only fetch assigned projects
        const assignedProjects = await projectService.getAssignedProjects(req.user.id);
        return res.status(200).json({ success: true, projects: assignedProjects });

    } catch (error) {
        console.error("❌ [Project Fetch Error]:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});


// ✅ Get a single project
const getProjectById = asyncHandler(async (req, res) => {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
        return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({ success: true, project });
});

// ✅ Update a project
const updateProject = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const updatedProject = await projectService.updateProject(req.params.id, req.body);
    if (!updatedProject) {
        return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({ success: true, updatedProject });
});

// ✅ Soft delete a project
const softDeleteProject = asyncHandler(async (req, res) => {
    const deletedProject = await projectService.softDeleteProject(req.params.id);
    if (!deletedProject) {
        return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.status(200).json({ success: true, message: "Project deleted successfully" });
});

// ✅ Restore a deleted project
const restoreProject = asyncHandler(async (req, res) => {
    const restoredProject = await projectService.restoreProject(req.params.id);
    if (!restoredProject) {
        return res.status(404).json({ success: false, message: "Project not found or already active" });
    }

    res.status(200).json({ success: true, message: "Project restored successfully", project: restoredProject });
});

// ✅ Get assigned projects for a staff member
const getAssignedProjects = asyncHandler(async (req, res) => {
    const userId = req.user.id; // Get logged-in user ID
    try {
        const assignedProjects = await projectService.getAssignedProjects(userId);

        if (!assignedProjects || assignedProjects.length === 0) {
            return res.status(404).json({ success: false, message: "No assigned projects found" });
        }

        res.status(200).json({ success: true, projects: assignedProjects });
    } catch (error) {
        console.error("❌ Error fetching assigned projects:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});


// ✅ Helper to get project and validate staff access
const getProjectByIdWithAccessCheck = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) return null;
    if (project.assignedStaff.includes(userId)) return project;
    return null; // 🚫 Deny access if not assigned
};

// ✅ Export all functions
module.exports = {
    createProject,
    getAllProjects,
    getProjectById,
    updateProject,
    softDeleteProject,
    restoreProject,
    getAssignedProjects,
    getProjectByIdWithAccessCheck
};
