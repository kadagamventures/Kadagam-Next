// 📂 routes/taskRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");

const upload = multer({ storage: multer.memoryStorage() });

const {
  createTask,
  updateTaskController,
  deleteTask,
  getAllTasks,
  getTaskById,
  getTasksByStaffId,
  submitDailyComment,
  getDailyComments,
  getTasksForKanban,
  updateTaskStatusByStaff,
  autoAdjustTaskPriorities, // ✅ New route added
  markOverdueTasks, // ✅ New route added
} = require("../controllers/taskController");

const { verifyToken, requireAdmin } = require("../middlewares/authMiddleware");
const checkPermissions = require("../middlewares/permissionsMiddleware");
const { errorHandler } = require("../middlewares/errorMiddleware");

// ✅ Protect All Routes (Login Required)
router.use(verifyToken);

// =====================
// ✅ Staff Routes
// =====================

// ✅ Get Tasks by Staff ID (Staff or Admin access)
router.get("/staff-tasks/:userId", async (req, res, next) => {
  try {
    const { userId } = req.params;
    const loggedInUserId = req.user.id;

    if (req.user.role === "admin" || loggedInUserId === userId) {
      await getTasksByStaffId(req, res, next);
    } else {
      return res.status(403).json({ message: "Unauthorized to access these tasks." });
    }
  } catch (error) {
    next(error);
  }
});

// ✅ Kanban Tasks for Staff (token-based fetch)
router.get("/kanban", (req, res, next) => {
  if (req.user.role === "admin") {
    return res.status(403).json({ message: "Admin Kanban not implemented" });
  }
  req.params.userId = req.user.id;
  getTasksForKanban(req, res, next);
});

// ✅ Kanban Task Status Update (Dedicated Route)
router.put(
  "/staff/:taskId",
  updateTaskStatusByStaff
);

// =====================
// ✅ Admin & Permissioned Staff Routes
// =====================

// ✅ Get All Tasks
router.get("/", (req, res, next) => {
  if (req.user.role === "admin" || req.user.permissions.includes("manage_task")) {
    getAllTasks(req, res, next);
  } else {
    return res.status(403).json({ message: "Admin or manage_task access required." });
  }
});

// ✅ Auto Adjust Task Priorities
router.post("/adjust-priorities", autoAdjustTaskPriorities);

// ✅ Mark Overdue Tasks
router.post("/mark-overdue", markOverdueTasks);

// =====================
// ✅ Daily Comments
// =====================

// ✅ Get Daily Comments (Admin Only) – must come BEFORE "/:id"
router.get("/daily-comments", requireAdmin, getDailyComments);

// ✅ Add Daily Comment
router.post(
  "/:id/daily-comment",
  submitDailyComment
);

// =====================
// ✅ Task Routes
// =====================

// ✅ Get Task By ID
router.get("/:id", checkPermissions("manage_task"), getTaskById);

// ✅ Create Task (Single staff assignment enforced)
router.post(
  "/",
  checkPermissions("manage_task"),
  upload.array("attachments"),
  createTask
);

// ✅ Update Task (Permissioned staff can't edit their own assigned task)
router.put("/:id", checkPermissions("manage_task"), async (req, res, next) => {
  try {
    const taskObj = await getTaskById(req, res, next, true); // true = return only task

    if (!taskObj) return res.status(404).json({ message: "Task not found." });

    if (
      req.user.role !== "admin" &&
      taskObj.assignedTo &&
      taskObj.assignedTo._id.toString() === req.user.id
    ) {
      return res.status(403).json({ message: "You cannot edit your own task." });
    }

    updateTaskController(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ✅ Delete Task (Admin Only)
router.delete("/:id", requireAdmin, deleteTask);

// ✅ Global Error Middleware (Always last)
router.use(errorHandler);

module.exports = router;
