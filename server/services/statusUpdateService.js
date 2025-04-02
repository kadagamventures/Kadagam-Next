const Task = require("../models/Task");

// @desc    Update task status
// @param   {String} taskId - ID of the task
// @param   {String} status - New status to update
// @returns {Object} Updated task
const updateTaskStatus = async (taskId, status) => {
    try {
        const validStatuses = ["pending", "in-progress", "completed", "on-hold"];
        if (!validStatuses.includes(status)) {
            throw new Error("Invalid status provided");
        }

        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { status },
            { new: true }
        );

        if (!updatedTask) {
            throw new Error("Task not found");
        }

        return updatedTask;
    } catch (error) {
        throw new Error("Error updating task status: " + error.message);
    }
};

// @desc    Bulk update task statuses
// @param   {Array} taskIds - Array of task IDs
// @param   {String} status - New status for all tasks
// @returns {Object} Result of bulk update
const bulkUpdateTaskStatus = async (taskIds, status) => {
    try {
        const validStatuses = ["pending", "in-progress", "completed", "on-hold"];
        if (!validStatuses.includes(status)) {
            throw new Error("Invalid status provided");
        }

        const result = await Task.updateMany(
            { _id: { $in: taskIds } },
            { $set: { status } }
        );

        return result;
    } catch (error) {
        throw new Error("Error in bulk updating task statuses: " + error.message);
    }
};

module.exports = {
    updateTaskStatus,
    bulkUpdateTaskStatus,
};
