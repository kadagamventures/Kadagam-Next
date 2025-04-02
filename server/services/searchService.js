const User = require("../models/User");
const Project = require("../models/Project");
const Task = require("../models/Task");

const searchService = {
    /**
     * Search users by name, email, or staffId.
     */
    async searchUsers(query) {
        return await User.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { email: { $regex: query, $options: "i" } },
                { staffId: { $regex: query, $options: "i" } }
            ]
        }).select("name email role staffId");
    },

    /**
     * Search projects by name or description.
     */
    async searchProjects(query) {
        return await Project.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } }
            ]
        }).select("name description createdAt");
    },

    /**
     * Search tasks by title, taskId, and optionally filter by assigned staff.
     */
    async searchTasks({ query, assignedStaffId = null }) {
        const searchQuery = { isDeleted: false };

        if (query) {
            searchQuery.$or = [
                { title: { $regex: query, $options: "i" } },
                { _id: query }  // Direct match if query is an exact Task ID
            ];
        }

        if (assignedStaffId) {
            searchQuery.assignedTo = assignedStaffId;  // Filter by assigned user if provided
        }

        return await Task.find(searchQuery)
            .populate("projects", "name")
            .populate("assignedTo", "name email")
            .select("title status assignedTo dueDate projects");
    },

    /**
     * Perform a global search across users, projects, and tasks.
     */
    async globalSearch(query) {
        const [users, projects, tasks] = await Promise.all([
            searchService.searchUsers(query),
            searchService.searchProjects(query),
            searchService.searchTasks({ query })
        ]);

        return { users, projects, tasks };
    },
};

module.exports = searchService;
