const express = require("express");
const authRoutes = require("./auth.route");
const resourceRoutes = require("./resource.route");
const bookingRoutes = require("./booking.route");
const issueReportRoutes = require("./issueReport.route");
const userRoutes = require("./user.route");
const dashboardRoutes = require("./dashboard.route");
const notificationRoutes = require("./notification.route");
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/resources", resourceRoutes);
router.use("/bookings", bookingRoutes);
router.use("/issue-reports", issueReportRoutes);
router.use("/users", userRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationRoutes);
module.exports = router;
