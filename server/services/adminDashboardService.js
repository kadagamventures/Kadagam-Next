const Task = require("../models/Task");
const Project = require("../models/Project");
const User = require("../models/User");

/**
 * ✅ Fetch Overview Data for Dashboard (Excludes Deleted Projects)
 */
const getOverviewData = async () => {
  const totalProjects = await Project.countDocuments({ isDeleted: false }); // Exclude deleted projects
  const totalStaff = await User.countDocuments({ isDeleted: false }); // 🔥 Fix: Count ALL active users
  const totalTasks = await Task.countDocuments({ isDeleted: false });
  const completedTasks = await Task.countDocuments({ status: "Completed" });

  return {
    totalProjects,
    totalStaff, // ✅ Now counting all non-deleted users
    totalTasks,
    completedTasks,
  };
};

/**
 * ✅ Fetch Data for Charts (Excludes Deleted Projects)
 */
const getChartData = async () => {
  const overview = await getOverviewData();

  // ✅ Bar Chart Data (Overview Breakdown)
  const barData = [
    { name: "Total Projects", value: overview.totalProjects },
    { name: "Total Staff", value: overview.totalStaff },
    { name: "Total Tasks", value: overview.totalTasks },
    { name: "Completed Tasks", value: overview.completedTasks },
  ];

  // ✅ Pie Chart Data (Task Distribution)
  const totalPending = await Task.countDocuments({ status: "Pending" });
  const totalOngoing = await Task.countDocuments({ status: "Ongoing" });

  const pieData = [
    { name: "Pending", value: totalPending },
    { name: "Ongoing", value: totalOngoing },
    { name: "Completed", value: overview.completedTasks },
  ];

  return { barData, pieData };
};

module.exports = { getOverviewData, getChartData };
