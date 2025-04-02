const taskService = require("../services/taskService");

// ✅ Create Task (Single staff enforced)
const createTask = async (req, res, next) => {
  try {
    if (Array.isArray(req.body.assignedTo)) {
      return res.status(400).json({ message: "Task must be assigned to one staff member only." });
    }

    const task = await taskService.createTask(req.body, req.user.id);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// ✅ Fetch All Tasks (Admin & Permissioned Staff)
const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await taskService.getAllTasks(req.user.role, req.user.permissions, req.user.id);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

// ✅ Fetch Task By ID
const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(
      req.params.id,
      req.user.id,
      req.user.role,
      req.user.permissions
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json(task);
  } catch (error) {
    next(error);
  }
};

// ✅ Fetch Tasks By Staff ID
const getTasksByStaffId = async (req, res, next) => {
  try {
    const tasks = await taskService.getTasksByStaffId(req.params.userId);
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

// ✅ Update Task (Enforce single staff assignment)
const updateTask = async (req, res, next) => {
  try {
    if (Array.isArray(req.body.assignedTo)) {
      return res.status(400).json({ message: "Task can only be assigned to one staff member." });
    }

    const updatedTask = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role,
      req.user.permissions
    );
    if (!updatedTask) return res.status(404).json({ message: "Task not found" });
    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// ✅ Separated Update Task Controller (used in certain routes)
const updateTaskController = async (req, res, next) => {
  try {
    if (Array.isArray(req.body.assignedTo)) {
      return res.status(400).json({ message: "Task can only be assigned to one staff member." });
    }

    const updatedTask = await taskService.updateTask(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role,
      req.user.permissions
    );
    if (!updatedTask) return res.status(404).json({ message: "Task not found" });
    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// ✅ Kanban Drag-Drop Status Update (For staff moving tasks)
const updateTaskStatusByStaff = async (req, res, next) => {
  try {
    const updatedTask = await taskService.updateTaskStatusByStaff(
      req.params.taskId,
      req.body, // { status: "Ongoing" } or similar
      req.user.id,
      req.user.role
    );
    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// ✅ Delete Task (Soft Delete with attachment cleanup)
const deleteTask = async (req, res, next) => {
  try {
    const deletedTask = await taskService.deleteTask(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found or already deleted." });
    }
    res.status(200).json({ message: "Task deleted successfully!", taskId: deletedTask._id });
  } catch (error) {
    console.error("❌ Error deleting task:", error.message);
    next(error);
  }
};

// ✅ Add Daily Comment
const addDailyComment = async (req, res, next) => {
  try {
    await taskService.addDailyComment(req.user.id, req.params.id, req.body.comment);
    res.status(200).json({ message: "Daily comment added" });
  } catch (error) {
    next(error);
  }
};

// ✅ Auto Adjust Priorities
const autoAdjustTaskPriorities = async (req, res, next) => {
  try {
    await taskService.autoAdjustTaskPriorities();
    res.status(200).json({ message: "Task priorities adjusted" });
  } catch (error) {
    next(error);
  }
};

// ✅ Mark Overdue Tasks
const markOverdueTasks = async (req, res, next) => {
  try {
    await taskService.markOverdueTasks();
    res.status(200).json({ message: "Overdue tasks updated" });
  } catch (error) {
    next(error);
  }
};

// ✅ Submit Daily Comment (Alias)
const submitDailyComment = async (req, res, next) => {
  try {
    await taskService.addDailyComment(req.user.id, req.params.id, req.body.comment);
    res.status(200).json({ message: "Daily comment added" });
  } catch (error) {
    next(error);
  }
};

// ✅ Get All Daily Comments (Admin Only)
const getDailyComments = async (req, res, next) => {
  try {
    const comments = await taskService.getDailyComments();
    res.status(200).json(comments);
  } catch (error) {
    next(error);
  }
};

// ✅ Fetch Kanban Tasks for Staff
const getTasksForKanban = async (req, res, next) => {
  try {
    const kanbanTasks = await taskService.getTasksForKanban(req.user.id);
    res.status(200).json(kanbanTasks);
  } catch (error) {
    next(error);
  }
};

// ✅ Auto-Delete Expired Tasks
const autoDeleteTasks = async (req, res, next) => {
  try {
    await taskService.autoDeleteTasks();
    res.status(200).json({ message: "Expired tasks auto-deleted successfully." });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getAllTasks,
  getTaskById,
  getTasksByStaffId,
  updateTask,
  updateTaskController,
  updateTaskStatusByStaff,
  deleteTask,
  addDailyComment,
  autoAdjustTaskPriorities,
  markOverdueTasks,
  submitDailyComment,
  getDailyComments,
  getTasksForKanban,
  autoDeleteTasks, // ✅ Added new cron job for auto-delete
};
