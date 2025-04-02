const express = require("express");
const router = express.Router();

const { 
    getOverviewReport, 
    getOverviewCharts 
} = require("../../controllers/reportControllers/overviewReportController");

const { verifyToken, requireAdmin } = require("../../middlewares/authMiddleware");

// ✅ Apply Authentication Middleware
router.use(verifyToken);

// ✅ Overview Report (Admin Only)
router.get("/", requireAdmin, getOverviewReport);

// ✅ Overview Charts (Admin Only)
router.get("/Charts", requireAdmin, getOverviewCharts);

module.exports = router;
