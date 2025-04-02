const Task = require("../models/Task");
const Project = require("../models/Project");
const taskFileService = require("./taskFileService");
const { extractFileKey, deleteFile } = require("../utils/fileUtils");
const cron = require("node-cron"); // ✅ Added cron

// ✅ Create Task (Single staff enforced)
const createTask = async (taskData, userId) => {
    if (!taskData.assignedTo) throw new Error("Task must be assigned to one staff member.");

    // ✅ Auto-assign createdBy
    taskData.createdBy = userId;

    const task = await Task.create(taskData);

    // ✅ Attach to projects
    await Project.updateMany(
        { _id: { $in: taskData.projects } },
        { $addToSet: { tasks: task._id } }
    );

    return task;
};

// ✅ Fetch All Tasks
const getAllTasks = async (userRole, userPermissions, userId) => {
    const query = { isDeleted: false };
    if (userRole !== "admin" && !userPermissions.includes("manage_task")) {
        query.assignedTo = userId;
    }

    return Task.find(query)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .populate("projects", "name")
        .lean();
};

// ✅ Fetch Task By ID
const getTaskById = async (taskId, userId, userRole, userPermissions) => {
    const query = { _id: taskId, isDeleted: false };
    if (userRole !== "admin" && !userPermissions.includes("manage_task")) {
        query.assignedTo = userId;
    }

    const task = await Task.findOne(query)
        .populate("assignedTo", "name email")
        .populate("createdBy", "name email")
        .populate("projects", "name")
        .lean();

    if (!task) throw new Error("Task not found or unauthorized access.");
    return task;
};

// ✅ Fetch Tasks By Staff ID
const getTasksByStaffId = async (staffId) => {
    return Task.find({ assignedTo: staffId, isDeleted: false })
        .populate("projects", "name")
        .populate("assignedTo", "name email")
        .lean();
};

// ✅ Update Task with permission checks
const updateTask = async (taskId, updateData, userId, userRole, userPermissions) => {
    if (updateData.assignedTo && Array.isArray(updateData.assignedTo)) {
        throw new Error("Task can only be assigned to one staff member.");
    }

    const task = await Task.findById(taskId);
    if (!task) throw new Error("Task not found.");

    if (
        userRole !== "admin" &&
        userPermissions.includes("manage_task") &&
        task.createdBy.toString() === userId
    ) {
        throw new Error("Permissioned staff cannot update their own tasks.");
    }

    Object.assign(task, updateData);
    await task.save();
    await task.populate("projects", "name");
    return task;
};

// ✅ Soft Delete Task (Handles attachments)
const deleteTask = async (taskId) => {
    const task = await Task.findOne({ _id: taskId, isDeleted: false });
    if (!task) return null;

    if (task.attachments?.length) {
        for (const attachment of task.attachments) {
            const fileKey = extractFileKey(attachment.fileUrl);
            if (fileKey) await taskFileService.deleteTaskAttachment(fileKey);
            if (attachment.localPath) await deleteFile(attachment.localPath);
        }
    }

    task.isDeleted = true;
    await task.save();
    return task;
};

// ✅ Add Daily Comment
const addDailyComment = async (staffId, taskId, comment) => {
    const task = await Task.findById(taskId);
    if (!task) throw new Error("Task not found.");

    task.dailyUpdates.push({ staffId, comment, date: new Date() });
    await task.save();
};

// ✅ Auto-Adjust Priorities based on due dates
const autoAdjustTaskPriorities = async () => {
    const now = new Date();
    const tasks = await Task.find({ status: { $in: ["To Do", "Ongoing"] }, isDeleted: false });

    for (const task of tasks) {
        const daysLeft = Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24));
        const newPriority = daysLeft <= 1 ? "High" : daysLeft <= 3 ? "Medium" : "Low";

        if (newPriority !== task.priority) {
            task.priority = newPriority;
            await task.save();
        }
    }
};

// ✅ Mark Overdue Tasks
const markOverdueTasks = async () => {
    await Task.updateMany(
        { dueDate: { $lt: new Date() }, status: { $in: ["To Do", "Ongoing"] }, isDeleted: false },
        { $set: { status: "Overdue" } }
    );
};

// ✅ Get Daily Comments
const getDailyComments = async () => {
    return Task.find({ "dailyUpdates.0": { $exists: true }, isDeleted: false })
        .select("title dailyUpdates")
        .populate("dailyUpdates.staffId", "name email")
        .lean();
};

// ✅ Auto-Delete Daily Comments Older Than 3 Days
const autoDeleteOldDailyComments = async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const tasks = await Task.find({ "dailyUpdates.0": { $exists: true }, isDeleted: false });

    for (const task of tasks) {
        task.dailyUpdates = task.dailyUpdates.filter(
            (update) => update.date > threeDaysAgo
        );
        await task.save();
    }
};

// ✅ Schedule Auto-Delete to Run Daily at 1:00 AM
cron.schedule("0 1 * * *", async () => {
    console.log("⏰ Auto-deleting old daily comments...");
    await autoDeleteOldDailyComments();
});

// ✅ Fetch Tasks for Kanban (Only staff's tasks)
const getTasksForKanban = async (staffId) => {
    const tasks = await Task.find({ assignedTo: staffId, isDeleted: false })
        .select("title status priority dueDate projects")
        .populate("projects", "name")
        .lean();

    const kanbanData = { todo: [], ongoing: [], completed: [], overdue: [] };

    tasks.forEach((task) => {
        const statusKey = task.status.toLowerCase().replace(" ", "");
        if (kanbanData[statusKey]) kanbanData[statusKey].push(task);
    });

    return kanbanData;
};

// ✅ Kanban Drag-Drop Task Status Update (with staff ownership check)
const updateTaskStatusByStaff = async (taskId, updateData, staffId, userRole) => {
    const query = { _id: taskId, isDeleted: false };
    if (userRole !== "admin") query.assignedTo = staffId;

    const task = await Task.findOne(query);
    if (!task) throw new Error("Task not found.");

    if (updateData.status) task.status = updateData.status;
    await task.save();
    return task;
};

module.exports = {
    createTask,
    getAllTasks,
    getTaskById,
    getTasksByStaffId,
    updateTask,
    deleteTask,
    addDailyComment,
    autoAdjustTaskPriorities,
    markOverdueTasks,
    getDailyComments,
    getTasksForKanban,
    updateTaskStatusByStaff,
};
