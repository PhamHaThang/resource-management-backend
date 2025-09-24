const { getPaginationAndFilter } = require("../utils/pagination");
const { createNotificationForUser } = require("../utils/notification");
const IssueReport = require("../models/issueReport.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("express-async-handler");
// [POST] /api/issue-reports
exports.createIssueReport = asyncHandler(async (req, res) => {
  const { resourceId, title, description } = req.body;
  const images = req.files ? req.files.map((file) => file.path) : [];
  const newReport = new IssueReport({
    userId: req.user._id,
    resourceId,
    images,
    title,
    description,
  });
  await newReport.save();
  return res.status(201).json({
    success: true,
    message: "Báo cáo sự cố thành công",
    data: newReport,
  });
});

// [GET] /api/issue-reports
exports.getAllIssueReports = asyncHandler(async (req, res) => {
  const allowedFilters = ["resourceId", "status"];
  const { filter, page, limit, skip } = getPaginationAndFilter(
    req.query,
    allowedFilters
  );
  if (req.user.role === "student") {
    filter.userId = req.user._id;
  }
  const total = await IssueReport.countDocuments(filter);

  const reports = await IssueReport.find(filter)
    .populate("userId", "name email")
    .populate({
      path: "resourceId",
      select: "name type",
      populate: { path: "type", select: "name -_id" },
    })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  return res.json({
    success: true,
    message: "Lấy danh sách báo cáo thành công",
    data: {
      total,
      page,
      limit,
      reports,
    },
  });
});

// [PUT] /api/issue-reports/:id/status
exports.updateIssueStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const report = await IssueReport.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  );
  if (!report)
    throw new AppError(404, "Không tìm thấy báo cáo sự cố", "NOT_FOUND");

  await createNotificationForUser(
    report.userId._id,
    "Trạng thái báo cáo sự cố thay đổi",
    `Báo cáo sự cố của bạn đã chuyển sang trạng thái: ${status}`,
    "issueReport",
    report._id
  );
  return res.json({
    success: true,
    message: "Cập nhật trạng thái thành công",
    data: report,
  });
});

// [DELETE] /api/issue-reports/:id
exports.deleteIssueReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const report = await IssueReport.findByIdAndDelete(id);
  if (!report)
    throw new AppError(404, "Không tìm thấy báo cáo sự cố", "NOT_FOUND");
  return res.json({
    success: true,
    message: "Xóa báo cáo sự cố thành công",
  });
});

// [GET] /api/issue-reports/:id
exports.getIssueReportDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const report = await IssueReport.findById(id)
    .populate("userId", "name email")
    .populate({
      path: "resourceId",
      select: "name type",
      populate: { path: "type", select: "name -_id" },
    });

  if (!report)
    throw new AppError(404, "Không tìm thấy báo cáo sự cố", "NOT_FOUND");

  const isOwner = report.userId._id.equals(req.user._id);
  if (req.user.role === "student" && !isOwner) {
    throw new AppError(403, "Không đủ quyền truy cập", "FORBIDDEN");
  }
  return res.json({
    success: true,
    message: "Lấy chi tiết báo cáo sự cố thành công",
    data: report,
  });
});
