const Project = require("../../models/Project");
const Task = require("../../models/Task");
const User = require("../../models/User");

/**
 * 📊 Get Overview Data (Real-Time Summary)
 * - Fetches Total Projects, Staff, Completed/Ongoing/Pending Tasks
 * - Supports Date-Wise Filtering (if startDate & endDate are provided)
 */
const getOverviewData = async (startDate, endDate) => {
    try {
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const totalProjects = await Project.countDocuments({ isDeleted: false, ...dateFilter }) || 0;
        const totalStaff = await User.countDocuments({ isActive: true, isDeleted: false }) || 0;
        const totalTasks = await Task.countDocuments({ isDeleted: false, ...dateFilter }) || 0;

        const ongoingTasks = await Task.countDocuments({ status: "Ongoing", isDeleted: false, ...dateFilter }) || 0;
        const completedTasks = await Task.countDocuments({ status: "Completed", isDeleted: false, ...dateFilter }) || 0;
        const toDoTasks = await Task.countDocuments({ status: "To Do", isDeleted: false, ...dateFilter }) || 0;

        const overdueTasks = await Task.countDocuments({
            dueDate: { $lt: new Date() },
            status: { $ne: "Completed" },
            isDeleted: false,
            ...dateFilter
        }) || 0;

        return {
            totalProjects,
            totalStaff,
            totalTasks,
            ongoingTasks,
            completedTasks,
            toDoTasks, // 🔹 Updated from "pendingTasks" to "toDoTasks"
            overdueTasks,
        };
    } catch (error) {
        console.error("❌ Error fetching overview data:", error);
        throw new Error("Failed to fetch overview data.");
    }
};

/**
 * 📈 Get Chart Data (Task, Project, Staff Trends)
 */
const getChartData = async (startDate, endDate) => {
    try {
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const taskStatusData = await Task.aggregate([
            { $match: { isDeleted: false, ...dateFilter } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        const projectStatusData = await Project.aggregate([
            { $match: { isDeleted: false, ...dateFilter } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]);

        // Filter out deleted staff by adding isDeleted: false
        const staffByRoleData = await User.aggregate([
            { $match: { isActive: true, isDeleted: false, ...dateFilter } },
            { $group: { _id: "$role", count: { $sum: 1 } } },
        ]);

        return {
            taskStatusData: formatChartData(taskStatusData, "Tasks by Status"),
            projectStatusData: formatChartData(projectStatusData, "Projects by Status"),
            staffByRoleData: formatChartData(staffByRoleData, "Staff by Role"),
        };
    } catch (error) {
        console.error("❌ Error fetching chart data:", error);
        throw new Error("Failed to fetch chart data.");
    }
};

/**
 * 🛠️ Helper Function: Format Data for Charts
 */
const formatChartData = (data, label) => {
    return {
        labels: data.map((item) => item._id),
        datasets: [
            {
                label: label,
                data: data.map((item) => item.count),
                backgroundColor: generateChartColors(data.length),
            },
        ],
    };
};

/**
 * 🎨 Dynamic Color Generator for Charts (HSL-based)
 */
const generateChartColors = (count) => {
    return Array.from({ length: count }, (_, i) => `hsl(${(i * 40) % 360}, 70%, 50%)`);
};

module.exports = {
    getOverviewData,
    getChartData,
};
