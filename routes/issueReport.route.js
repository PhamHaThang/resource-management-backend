const express = require("express");
const issueReportController = require("../controllers/issueReport.controller");
const { authenticateJWT, requireRoles } = require("../middlewares/auth");
const router = express.Router();

router.use(authenticateJWT);
router.post(
  "/",
  requireRoles("admin", "teacher", "student"),
  issueReportController.createIssueReport
);
router.get(
  "/",
  requireRoles("admin", "teacher", "student"),
  issueReportController.getAllIssueReports
);
router.get(
  "/:id",
  requireRoles("admin", "teacher", "student"),
  issueReportController.getIssueReportDetail
);
router.put(
  "/:id/status",
  requireRoles("admin"),
  issueReportController.updateIssueStatus
);
router.delete(
  "/:id",
  requireRoles("admin"),
  issueReportController.deleteIssueReport
);
module.exports = router;
