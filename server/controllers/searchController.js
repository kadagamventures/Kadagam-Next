const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");  //  Added for Task Search

/**
 * @desc    Search staff by name, email, or staff ID
 * @route   GET /search/staff
 * @access  Admin & Permissioned Staff
 */
const searchStaff = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        const staffList = await User.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { staffId: { $regex: query, $options: "i" } }
            ]
        }).lean();

        res.status(200).json(staffList);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Search projects by name, relatedTo, or status
 * @route   GET /search/projects
 * @access  Admin & Permissioned Staff
 */
const searchProjects = async (req, res) => {
    try {
        const { query, relatedTo, status } = req.query;

        const searchQuery = { isDeleted: false };

        if (query) {
            searchQuery.name = { $regex: query, $options: "i" };
        }

        if (relatedTo) {
            searchQuery.relatedTo = { $regex: relatedTo, $options: "i" };
        }

        if (status) {
            searchQuery.status = status;
        }

        const projects = await Project.find(searchQuery).lean();

        res.status(200).json({ projects });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

/**
 * @desc    Search tasks by Task ID, Task Title, or Assigned Staff
 * @route   GET /search/tasks
 * @access  Admin & Permissioned Staff
 */
const searchTasks = async (req, res) => {
    try {
        const { query, assignedStaffId } = req.query;

        const searchQuery = { isDeleted: false };

        if (query) {
            searchQuery.$or = [
                { title: { $regex: query, $options: "i" } },       // Search by title
                { _id: query }                                     // Search by exact task ID (optional)
            ];
        }

        if (assignedStaffId) {
            searchQuery.assignedTo = assignedStaffId;  // Filter by assigned staff
        }

        const tasks = await Task.find(searchQuery)
            .populate("projects", "name")
            .populate("assignedTo", "name email")
            .lean();

        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = {
    searchStaff,
    searchProjects,
    searchTasks, 
};
