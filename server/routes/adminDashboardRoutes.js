const express = require("express");
const { getDashboardOverview, getDashboardCharts } = require("../controllers/adminDashboardController");
const router = express.Router();

// ✅ Fetch Dashboard Overview (Total Projects, Staff, Tasks)
router.get("/overview", getDashboardOverview);

// ✅ Fetch Dashboard Chart Data (Bar & Pie Charts)
router.get("/charts", getDashboardCharts);

module.exports = router;
