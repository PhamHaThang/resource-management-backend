const express = require("express");
const issueReportController = require("../controllers/issueReport.controller");
const {
  authenticateJWT,
  requireRoles,
} = require("../middlewares/auth.middleware");
const { multipleUpload } = require("../middlewares/uploadImage.middleware");
const router = express.Router();

router.use(authenticateJWT);
router.post(
  "/",
  requireRoles("admin", "teacher", "student"),
  multipleUpload("images"),
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
