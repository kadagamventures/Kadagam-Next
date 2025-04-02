const Task = require("../../models/Task");
const User = require("../../models/User");
const awsService = require("../../services/awsService"); // ✅ AWS S3 Storage
const pdfService = require("../../services/pdfService"); // ✅ PDF Generation
const moment = require("moment");

const REPORT_EXPIRATION_DAYS = 365; // ✅ Auto-delete reports after 1 year

const taskReportService = {
  // ✅ 1. Live Task Statistics (Optimized with Aggregation)
  async getLiveTaskStats() {
    const stats = await Task.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTasks = stats.reduce((acc, stat) => acc + stat.count, 0);
    const completedTasks = stats.find(stat => stat._id === "Completed")?.count || 0;
    const ongoingTasks = stats.find(stat => stat._id === "Ongoing")?.count || 0;
    const overdueTasks = stats.find(stat => stat._id === "Overdue")?.count || 0;
    const toDoTasks = stats.find(stat => stat._id === "To Do")?.count || 0;
    const highPriorityTasks = await Task.countDocuments({ priority: "High", isDeleted: false });
    const dueToday = await Task.countDocuments({
      dueDate: { $gte: moment().startOf("day").toDate(), $lt: moment().endOf("day").toDate() },
      isDeleted: false
    });

    return { totalTasks, completedTasks, ongoingTasks, overdueTasks, toDoTasks, highPriorityTasks, dueToday };
  },

  // ✅ 2. Generate Task Report (Daily, Monthly, Yearly) & Store in AWS S3
  async generateTaskReport(reportType, month, year) {
    const { startDate, endDate } = getDateRange(reportType, month, year);
    const tasks = await Task.find({
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false
    }).populate("assignedTo", "name email");

    const priorityStats = {
      high: tasks.filter(task => task.priority === "High").length,
      medium: tasks.filter(task => task.priority === "Medium").length,
      low: tasks.filter(task => task.priority === "Low").length,
    };

    const overdueTasks = tasks.filter(task => task.status === "Overdue").map(mapTaskRecord);
    const topPerformingStaff = await getTopPerformingStaff(tasks);

    const reportData = {
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(task => task.status === "Completed").length,
        completionRate: ((tasks.filter(task => task.status === "Completed").length / (tasks.length || 1)) * 100).toFixed(2) + "%",
        avgCompletionTime: calculateAverageCompletionTime(tasks),
      },
      priorityStats,
      tasks: tasks.map(mapTaskRecord),
      overdueTasks,
      performance: topPerformingStaff,
    };

    const title = `${capitalize(reportType)} Task Report - ${moment(startDate).format("MMMM YYYY")}`;
    const pdfBuffer = await pdfService.generateReportPDF(reportData, title);

    // ✅ Store Report in AWS S3
    const fileName = `reports/task/${year}/${month}/${reportType}-task-report.pdf`;
    const uploadResult = await awsService.uploadFile(pdfBuffer, fileName, { expiresIn: "1y" });

    return uploadResult.url;
  },

  // ✅ 3. Auto-Delete Expired Reports from AWS S3
  async deleteExpiredTaskReports() {
    try {
      const allFiles = await awsService.listFiles("reports/task/");
      const expirationTime = Date.now() - REPORT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

      for (const file of allFiles) {
        const fileTimestamp = parseInt(file.Key.match(/\d+/g)?.[0]);
        if (fileTimestamp && fileTimestamp < expirationTime) {
          await awsService.deleteFile(file.Key);
          console.log(`🗑️ Deleted expired task report: ${file.Key}`);
        }
      }
    } catch (error) {
      console.error("❌ Error auto-deleting expired task reports:", error);
    }
  }
};

// 🔹 Helper - Get Date Range
function getDateRange(type, month, year) {
  const date = moment(`${year}-${month}-01`);
  return type === "daily"
    ? { startDate: date.startOf("day").toDate(), endDate: date.endOf("day").toDate() }
    : type === "monthly"
      ? { startDate: date.startOf("month").toDate(), endDate: date.endOf("month").toDate() }
      : { startDate: date.startOf("year").toDate(), endDate: date.endOf("year").toDate() };
}

// 🔹 Helper - Top Performing Staff
async function getTopPerformingStaff(tasks) {
  const performance = {};
  tasks.forEach(task => {
    if (task.status === "Completed") {
      task.assignedTo.forEach(staff => {
        performance[staff._id] = (performance[staff._id] || 0) + 1;
      });
    }
  });

  const staffDetails = await User.find({ _id: { $in: Object.keys(performance) } }).select("name email");
  return staffDetails.map(staff => ({
    name: staff.name,
    email: staff.email,
    tasksCompleted: performance[staff._id] || 0,
  })).sort((a, b) => b.tasksCompleted - a.tasksCompleted);
}

// 🔹 Helper - Calculate Average Completion Time
function calculateAverageCompletionTime(tasks) {
  const completedTasks = tasks.filter(task => task.status === "Completed" && task.completedAt && task.createdAt);
  if (!completedTasks.length) return "N/A";

  const totalTime = completedTasks.reduce((acc, task) => acc + (new Date(task.completedAt) - new Date(task.createdAt)), 0);
  const avgTime = totalTime / completedTasks.length;
  return `${Math.round(avgTime / (1000 * 60 * 60))} hrs`;
}

// 🔹 Helper - Format Task Record
function mapTaskRecord(task) {
  return {
    title: task.title,
    status: task.status,
    priority: task.priority,
    assignedTo: task.assignedTo.map(staff => staff.name).join(", "),
    dueDate: moment(task.dueDate).format("YYYY-MM-DD"),
    completedAt: task.completedAt ? moment(task.completedAt).format("YYYY-MM-DD") : "N/A"
  };
}

// 🔹 Helper - Capitalize string
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = taskReportService;
