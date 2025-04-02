const express = require("express");
const router = express.Router();

// Import all report routes
const overviewReportRoutes = require("./reportRoutes/overviewReportRoutes");
const attendanceReportRoutes = require("./reportRoutes/attendanceReportRoutes");
const taskReportRoutes = require("./reportRoutes/taskReportRoutes");
const projectReportRoutes = require("./reportRoutes/projectReportRoutes");
const staffReportRoutes = require("./reportRoutes/staffReportRoutes");
const leaveReportRoutes = require("./reportRoutes/leaveReportRoutes");

// Use sub-routes
router.use("/overview", overviewReportRoutes);
router.use("/attendance", attendanceReportRoutes);
router.use("/tasks", taskReportRoutes);
router.use("/projects", projectReportRoutes);
router.use("/staff", staffReportRoutes);
router.use("/leave", leaveReportRoutes);

module.exports = router;
