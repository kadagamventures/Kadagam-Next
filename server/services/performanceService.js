const Task = require("../models/Task");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const ReportArchive = require("../models/ReportArchive");
const pdfService = require("./pdfService");
const awsService = require("./awsService");

const getOverallStaffPerformance = async () => {
  try {
    // Count all users who have a non-admin role (assuming staff roles are anything except "admin")
    const totalStaff = await User.countDocuments({ role: { $ne: "admin" }, isActive: true });

    // Get distinct active staff from tasks
    const activeStaff = await Task.distinct("assignedTo", { status: { $nin: ["Completed", "Cancelled"] } });
    
    // Ensure inactiveStaff doesn't go negative
    const inactiveStaff = Math.max(totalStaff - activeStaff.length, 0);

    // Attendance calculations
    const totalAttendance = await Attendance.countDocuments({ status: "Present" });
    const totalRecords = await Attendance.countDocuments();
    const attendancePercentage = totalRecords > 0 ? (totalAttendance / totalRecords) * 100 : 0;

    // Task calculations
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "Completed" });
    const overdueTasks = await Task.countDocuments({ status: "Overdue" });

    const onTimeCompletionRate = completedTasks > 0 ? ((completedTasks - overdueTasks) / completedTasks) * 100 : 0;
    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Get top performer based on completed tasks
    const topPerformer = await User.aggregate([
      { $match: { role: { $ne: "admin" }, isActive: true } },
      { $lookup: { from: "tasks", localField: "_id", foreignField: "assignedTo", as: "tasks" } },
      {
        $project: {
          name: 1,
          completedTasks: { $size: { $filter: { input: "$tasks", as: "t", cond: { $eq: ["$$t.status", "Completed"] } } } }
        }
      },
      { $sort: { completedTasks: -1 } },
      { $limit: 1 }
    ]);

    return {
      totalStaff,
      activeStaff: activeStaff.length,
      inactiveStaff,
      attendancePercentage: attendancePercentage.toFixed(2),
      taskCompletionRate: ((completedTasks / Math.max(totalTasks, 1)) * 100).toFixed(2),
      onTimeCompletionRate: onTimeCompletionRate.toFixed(2),
      successRate: successRate.toFixed(2),
      topPerformer: topPerformer[0] || null
    };
  } catch (error) {
    console.error("❌ Error fetching overall performance:", error);
    throw error;
  }
};

// ✅ Individual Staff Performance with Extended Metrics (Without Redis)
const getStaffPerformanceById = async (staffId) => {
  try {
    const staff = await User.findById(staffId);
    if (!staff) throw new Error("Staff not found");

    const totalPresent = await Attendance.countDocuments({ staff: staffId, status: "Present" });
    const totalAbsent = await Attendance.countDocuments({ staff: staffId, status: "Absent" });
    const totalAttendanceRecords = totalPresent + totalAbsent;
    const attendancePercentage = totalAttendanceRecords > 0 ? (totalPresent / totalAttendanceRecords) * 100 : 0;

    const totalTasksAssigned = await Task.countDocuments({ assignedTo: staffId });
    const completedTasks = await Task.countDocuments({ assignedTo: staffId, status: "Completed" });
    const overdueTasks = await Task.countDocuments({ assignedTo: staffId, status: "Overdue" });
    const highPriorityCompleted = await Task.countDocuments({
      assignedTo: staffId,
      status: "Completed",
      priority: { $in: ["High", "Critical"] }
    });
    const ongoingTasks = await Task.countDocuments({ assignedTo: staffId, status: "Ongoing" });

    const taskCompletionRate = totalTasksAssigned > 0 ? (completedTasks / totalTasksAssigned) * 100 : 0;
    const onTimeCompletionRate = completedTasks > 0 ? ((completedTasks - overdueTasks) / completedTasks) * 100 : 0;
    const successRate = totalTasksAssigned > 0 ? (completedTasks / totalTasksAssigned) * 100 : 0;
    const efficiencyScore = completedTasks / Math.max(totalPresent, 1);
    const consistencyScore = 90; // Placeholder for future use

    const overallPerformanceScore = (successRate * 0.4 + attendancePercentage * 0.3 + onTimeCompletionRate * 0.2 + efficiencyScore * 0.1);

    return {
      staffId,
      name: staff.name,
      email: staff.email,
      totalTasksAssigned,
      totalTasksCompleted: completedTasks,
      taskCompletionRate: taskCompletionRate.toFixed(2),
      onTimeCompletionRate: onTimeCompletionRate.toFixed(2),
      overdueTasks,
      highPriorityTasksCompleted: highPriorityCompleted,
      ongoingTasks,
      totalDaysPresent: totalPresent,
      totalDaysAbsent: totalAbsent,
      attendancePercentage: attendancePercentage.toFixed(2),
      successRate: successRate.toFixed(2),
      efficiencyScore: efficiencyScore.toFixed(2),
      consistencyScore,
      overallPerformanceScore: overallPerformanceScore.toFixed(2)
    };
  } catch (error) {
    console.error("❌ Error fetching staff performance:", error);
    throw error;
  }
};

// ✅ Staff Dashboard Chart Data
const getStaffVisualizationData = async () => {
  try {
    const attendanceTrends = await Attendance.aggregate([
      {
        $group: {
          _id: { month: { $month: "$date" }, year: { $year: "$date" } },
          presentDays: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const taskCompletionGraph = await Task.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    return { attendanceTrends, taskCompletionGraph };
  } catch (error) {
    console.error("❌ Error fetching visualization data:", error);
    return {};
  }
};

// ✅ Generate Monthly Report PDF
const generateMonthlyStaffReportPDF = async (year, month) => {
  try {
    const existingReport = await ReportArchive.findOne({
      reportType: "Staff",
      reportYear: year,
      reportMonth: month
    });
    if (existingReport) return existingReport.fileUrl;

    const reportData = await getStaffVisualizationData();
    const pdfBuffer = await pdfService.generateStaffReportPDF(reportData, `Staff Report - ${month}/${year}`);
    const fileName = `reports/staff/${year}/${month}/staff-report.pdf`;
    const fileUrl = await awsService.uploadFile(pdfBuffer, fileName, { expiresIn: "1y" });

    await ReportArchive.create({ reportType: "Staff", reportMonth: month, reportYear: year, fileUrl });
    return fileUrl;
  } catch (err) {
    console.error("❌ Error generating or uploading Monthly Staff Report PDF:", err);
    throw err;
  }
};

// ✅ Archive Final Report when staff is removed
const archiveRemovedStaffReport = async (staffId) => {
  try {
    const performanceData = await getStaffPerformanceById(staffId);
    const pdfBuffer = await pdfService.generateFinalStaffReportPDF(performanceData, "Final Report");

    const fileName = `reports/removed_staff/${staffId}-${Date.now()}.pdf`;
    const fileUrl = await awsService.uploadFile(pdfBuffer, fileName, { expiresIn: "5y" });

    await ReportArchive.create({ reportType: "FinalStaff", staffId, fileUrl, archivedAt: new Date() });
    return fileUrl;
  } catch (err) {
    console.error("❌ Error archiving removed staff report:", err);
    throw err;
  }
};

// ✅ Monthly Performance
const getMonthlyPerformance = async (staffId, year, month) => {
  const tasks = await Task.find({
    assignedTo: staffId,
    createdAt: { $gte: new Date(`${year}-${month}-01`), $lte: new Date(`${year}-${month}-31`) }
  });

  const completed = tasks.filter(t => t.status === 'Completed').length;
  const overdue = tasks.filter(t => t.status === 'Overdue').length;

  return {
    totalTasks: tasks.length,
    completed,
    overdue,
    completionRate: tasks.length ? ((completed / tasks.length) * 100).toFixed(2) : "0.00"
  };
};


// ✅ Yearly Performance
const getYearlyPerformance = async (staffId, year) => {
  const tasks = await Task.find({
    assignedTo: staffId,
    createdAt: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) }
  });

  const completed = tasks.filter(t => t.status === 'Completed').length;
  const overdue = tasks.filter(t => t.status === 'Overdue').length;

  return {
    totalTasks: tasks.length,
    completed,
    overdue,
    completionRate: tasks.length ? ((completed / tasks.length) * 100).toFixed(2) : "0.00"
  };
};

// ✅ Monthly Individual Staff Performance with Extended Metrics (By Month)
const getMonthlyPerformanceById = async (staffId, year, month) => {
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(`${year}-${month}-31`);
  
    // Filter tasks within the month
    const tasks = await Task.find({
      assignedTo: staffId,
      createdAt: { $gte: startDate, $lte: endDate },
    });
  
    const totalTasksAssigned = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const overdueTasks = tasks.filter(t => t.status === 'Overdue').length;
    const highPriorityCompleted = tasks.filter(
      t => t.status === 'Completed' && ['High', 'Critical'].includes(t.priority)
    ).length;
    const ongoingTasks = tasks.filter(t => t.status === 'Ongoing').length;
  
    // Filter attendance for the month
    const attendanceRecords = await Attendance.find({
      staff: staffId,
      date: { $gte: startDate, $lte: endDate }
    });
    const totalPresent = attendanceRecords.filter(a => a.status === 'Present').length;
    const totalAbsent = attendanceRecords.filter(a => a.status === 'Absent').length;
    const totalAttendance = totalPresent + totalAbsent;
    const attendancePercentage = totalAttendance > 0 ? (totalPresent / totalAttendance) * 100 : 0;
  
    const taskCompletionRate = totalTasksAssigned > 0 ? (completedTasks / totalTasksAssigned) * 100 : 0;
    const onTimeCompletionRate = completedTasks > 0 ? ((completedTasks - overdueTasks) / completedTasks) * 100 : 0;
    const successRate = totalTasksAssigned > 0 ? (completedTasks / totalTasksAssigned) * 100 : 0;
    const efficiencyScore = completedTasks / Math.max(totalPresent, 1);
    const consistencyScore = 90; // Optional placeholder
    const overallPerformanceScore = (successRate * 0.4 + attendancePercentage * 0.3 + onTimeCompletionRate * 0.2 + efficiencyScore * 0.1);
  
    return {
      totalTasksAssigned,
      totalTasksCompleted: completedTasks,
      taskCompletionRate: taskCompletionRate.toFixed(2),
      onTimeCompletionRate: onTimeCompletionRate.toFixed(2),
      overdueTasks,
      highPriorityTasksCompleted: highPriorityCompleted,
      ongoingTasks,
      totalDaysPresent: totalPresent,
      totalDaysAbsent: totalAbsent,
      attendancePercentage: attendancePercentage.toFixed(2),
      successRate: successRate.toFixed(2),
      efficiencyScore: efficiencyScore.toFixed(2),
      consistencyScore,
      overallPerformanceScore: overallPerformanceScore.toFixed(2)
    };
  };
  

module.exports = {
  getOverallStaffPerformance,
  getStaffPerformanceById,
  getStaffVisualizationData,
  generateMonthlyStaffReportPDF,
  archiveRemovedStaffReport,
  getMonthlyPerformance,
  getYearlyPerformance,
  getMonthlyPerformanceById
};
