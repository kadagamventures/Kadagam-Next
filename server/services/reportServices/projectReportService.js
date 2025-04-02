const Project = require("../../models/Project");
const Task = require("../../models/Task");
const User = require("../../models/User");
const awsService = require("../../services/awsService"); // ✅ AWS S3 for report storage
const pdfService = require("../../services/pdfService"); // ✅ PDF generation
const { format } = require("date-fns");

const REPORT_EXPIRATION_DAYS = 365; // ✅ Auto-delete reports after 1 year

/**
 * ✅ Auto-move ongoing projects with no tasks to Completed
 */
const autoMoveEmptyOngoingProjects = async () => {
    const emptyOngoingProjects = await Project.find({
        isDeleted: false,
        status: "Ongoing",
        tasks: { $size: 0 }
    });

    if (emptyOngoingProjects.length > 0) {
        await Project.updateMany(
            { _id: { $in: emptyOngoingProjects.map(p => p._id) } },
            { $set: { status: "Completed" } }
        );
        console.log(`✅ Moved ${emptyOngoingProjects.length} empty ongoing projects to Completed.`);
    }
};

/**
 * ✅ 1. Get Live Project Statistics
 */
const getLiveProjectStats = async () => {
    // Auto-move empty ongoing projects to Completed before fetching stats
    await autoMoveEmptyOngoingProjects();

    // Fetch updated project statistics
    const totalProjects = await Project.countDocuments({ isDeleted: false });
    const completedProjects = await Project.countDocuments({ status: "Completed", isDeleted: false });
    const ongoingProjects = await Project.countDocuments({ status: "Ongoing", isDeleted: false });
    const cancelledProjects = await Project.countDocuments({ status: "Cancelled", isDeleted: false });
    const overdueProjects = await Project.countDocuments({
        isDeleted: false,
        endDate: { $lt: new Date() },
        status: { $nin: ["Completed", "Cancelled"] }
    });

    return {
        totalProjects,
        completedProjects,
        ongoingProjects,
        overdueProjects,
        cancelledProjects,
        pendingProjects: 0 // No need to track pending projects separately
    };
};

/**
 * ✅ 2. Generate Monthly Project Report (PDF + Upload to AWS S3)
 */
const generateMonthlyProjectReport = async (month, year) => {
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    // Auto-move empty ongoing projects to Completed before generating reports
    await autoMoveEmptyOngoingProjects();

    // Fetch projects created in the specified month
    const projects = await Project.find({
        isDeleted: false,
        createdAt: { $gte: startDate, $lt: endDate }
    }).populate("tasks").lean();

    const staffPerformance = {};
    const reportData = {
        month: format(startDate, "MMMM yyyy"),
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p.status === "Completed").length,
        overdueProjects: projects.filter(p => p.status !== "Completed" && p.endDate && p.endDate < new Date()).length,
        cancelledProjects: projects.filter(p => p.status === "Cancelled").length,
        projectBreakdown: [],
        staffPerformance: []
    };

    for (const project of projects) {
        const projectProgress = await calculateProjectProgress(project._id);
        const completedTasks = project.tasks.filter(t => t.status === "Completed").length;

        // Track staff performance by completed tasks
        project.assignedStaff?.forEach(staffId => {
            if (!staffPerformance[staffId]) {
                staffPerformance[staffId] = { completedTasks: 0 };
            }
            staffPerformance[staffId].completedTasks += completedTasks;
        });

        // Add project details to the breakdown
        reportData.projectBreakdown.push({
            name: project.name,
            status: project.status,
            completionRate: projectProgress.toFixed(2),
            completedTasks,
            totalTasks: project.tasks.length
        });
    }

    // Get staff details for performance breakdown
    const staffDetails = await User.find({
        _id: { $in: Object.keys(staffPerformance) },
        isDeleted: false // ✅ Ignore deleted staff
    }).lean();

    staffDetails.forEach(staff => {
        reportData.staffPerformance.push({
            name: staff.name,
            completedTasks: staffPerformance[staff._id]?.completedTasks || 0
        });
    });

    // Generate PDF report
    const pdfBuffer = await pdfService.generateProjectReportPDF(reportData);
    const fileName = `reports/project/${year}/${month}/project-report.pdf`;

    // Upload to AWS S3 with 1-year expiration
    const uploadResult = await awsService.uploadFile(pdfBuffer, fileName, { expiresIn: "1y" });

    return uploadResult.url;
};

/**
 * ✅ 3. Fetch Monthly Project Report Link (Stored in AWS S3)
 */
const getMonthlyProjectReportLink = async (month, year) => {
    const fileName = `reports/project/${year}/${month}/project-report.pdf`;
    return await awsService.getFileUrl(fileName);
};

/**
 * ✅ 4. Auto-Delete Expired Reports from AWS S3
 */
const deleteExpiredProjectReports = async () => {
    try {
        const allFiles = await awsService.listFiles("reports/project/");
        const expirationTime = Date.now() - REPORT_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

        for (const file of allFiles) {
            const fileTimestamp = parseInt(file.Key.match(/\d+/g)?.[0]);
            if (fileTimestamp && fileTimestamp < expirationTime) {
                await awsService.deleteFile(file.Key);
                console.log(`🗑️ Deleted expired project report: ${file.Key}`);
            }
        }
    } catch (error) {
        console.error("❌ Error auto-deleting expired project reports:", error);
    }
};

/**
 * ✅ Helper to calculate project progress
 */
const calculateProjectProgress = async (projectId) => {
    const tasks = await Task.find({ projects: projectId, isDeleted: false });
    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(task => task.status === "Completed").length;
    return (completedTasks / tasks.length) * 100;
};

module.exports = {
    getLiveProjectStats,
    generateMonthlyProjectReport,
    getMonthlyProjectReportLink,
    deleteExpiredProjectReports
};
