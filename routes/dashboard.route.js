const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboard.controller");
const { authenticateJWT, requireRoles } = require("../middlewares/auth");

router.use(authenticateJWT);
router.use(requireRoles("admin"));
router.get("/booking-stats", dashboardController.getBookingStats);
router.get("/issue-report-stats", dashboardController.getIssueReportStats);
router.get("/booking-stats-by-date", dashboardController.getBookingStatsByDate);

module.exports = router;
