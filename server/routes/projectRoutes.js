const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const { verifyToken } = require("../middlewares/authMiddleware");
const checkPermissions = require("../middlewares/permissionsMiddleware");

// ✅ Protect All Routes (Login Required)
router.use(verifyToken);

// ✅ Project Management (Only Admin & Permissioned Staff)
router.post("/", checkPermissions("manage_project"), projectController.createProject);
router.put("/:id", checkPermissions("manage_project"), projectController.updateProject);
router.delete("/:id", checkPermissions("manage_project"), projectController.softDeleteProject);
router.put("/:id/restore", checkPermissions("manage_project"), projectController.restoreProject);

// ✅ Middleware: Check if the user has access to the project
const checkProjectAccess = async (req, res, next) => {
    try {
        const { id: userId, role, permissions } = req.user;

        // ✅ Admins & Permissioned Staff with "manage_project" can access all projects
        if (role === "admin" || permissions.includes("manage_project")) {
            return next();
        }

        // ✅ Check if the staff is assigned to the project
        const project = await projectController.getProjectByIdWithAccessCheck(req.params.id, userId);
        if (!project) {
            return res.status(403).json({ message: "Access denied: You are not assigned to this project." });
        }

        return next(); // 🚀 Proceed if access is granted
    } catch (error) {
        console.error("❌ [Project Access] Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

// ✅ Get All Projects (Only Admins & Permissioned Staff)
router.get("/", async (req, res, next) => {
    try {
        console.log("🔍 User Data:", req.user); // Debugging

        const { role, permissions } = req.user || {};

        // ✅ Admins & "manage_project" fetch all projects
        if (role === "admin" || (permissions && permissions.includes("manage_project"))) {
            return projectController.getAllProjects(req, res, next);
        }

        // ✅ "manage_task" users can also fetch projects (Fix)
        if (permissions.includes("manage_task")) {
            console.log("✅ [Project Fetch] Allowing manage_task users to see projects.");
            return projectController.getAllProjects(req, res, next);
        }

        return res.status(403).json({ message: "❌ Access denied: No permission to view projects." });
    } catch (error) {
        console.error("❌ [Project Fetch Error]:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
});



// ✅ Get a Project by ID (Admin, Permissioned Staff, or Assigned Staff)
router.get("/:id", checkProjectAccess, projectController.getProjectById);

module.exports = router;
