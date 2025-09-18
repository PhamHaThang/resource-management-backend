const express = require("express");
const authRoutes = require("./auth.route");
const resourceRoutes = require("./resource.route");
const bookingRoutes = require("./booking.route");
const issueReportRoutes = require("./issueReport.route");
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/resources", resourceRoutes);
router.use("/booking", bookingRoutes);
router.use("/issue-reports", issueReportRoutes);

module.exports = router;
