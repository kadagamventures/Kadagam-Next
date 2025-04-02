const Project = require("../models/Project");

const projectService = {
    async createProject(projectData) {
        return await Project.create(projectData);
    },

    async getAllProjects(search = "") {
        const query = { isDeleted: false };
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        return await Project.find(query).lean();
    },

    async getProjectById(projectId) {
        return await Project.findOne({ _id: projectId, isDeleted: false }).lean();
    },

    async updateProject(projectId, updateData) {
        return await Project.findOneAndUpdate(
            { _id: projectId, isDeleted: false },
            { $set: updateData },
            { new: true }
        ).lean();
    },

    async softDeleteProject(projectId) {
        return await Project.findOneAndUpdate(
            { _id: projectId, isDeleted: false },
            { isDeleted: true },
            { new: true }
        ).lean();
    },

    async restoreProject(projectId) {
        return await Project.findOneAndUpdate(
            { _id: projectId, isDeleted: true },
            { isDeleted: false },
            { new: true }
        ).lean();
    },
};

module.exports = projectService;
