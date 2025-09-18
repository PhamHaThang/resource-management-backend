const express = require("express");
const router = express.Router();
const issueReportController = require("../controllers/issueReport.controller");

router.post("/", issueReportController.createIssueReport);
router.get("/", issueReportController.getAllIssueReports);
router.put("/:id/status", issueReportController.updateIssueStatus);

module.exports = router;
