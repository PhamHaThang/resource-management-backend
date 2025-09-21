const { getPaginationAndFilter } = require("../utils/pagination");
const IssueReport = require("../models/issueReport.model");
// [POST] /api/issue-reports
exports.createIssueReport = async (req, res) => {
  try {
    const { resourceId, title, description } = req.body;
    const userId = req.user._id;
    const newReport = new IssueReport({
      userId,
      resourceId,
      title,
      description,
    });
    await newReport.save();
    return res.status(201).json({
      success: true,
      message: "Báo cáo sự cố thành công",
      data: newReport,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [GET] /api/issue-reports
exports.getAllIssueReports = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [PUT] /api/issue-reports/:id/status
exports.updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["new", "in_progress", "resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
        error: "INVALID_STATUS",
      });
    }
    const report = await IssueReport.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!report)
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy báo cáo sự cố",
        error: "NOT_FOUND",
      });
    await createNotificationForUser(
      issueReport.userId._id,
      "Trạng thái báo cáo sự cố thay đổi",
      `Báo cáo sự cố của bạn đã chuyển sang trạng thái: ${status}`,
      "issueReport",
      issueReport._id
    );
    return res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [DELETE] /api/issue-reports/:id
exports.deleteIssueReport = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await IssueReport.findByIdAndDelete(id);
    if (!report)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo cáo sự cố",
        error: "NOT_FOUND",
      });
    return res.json({
      success: true,
      message: "Xóa báo cáo sự cố thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};

// [GET] /api/issue-reports/:id
exports.getIssueReportDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const report = await IssueReport.findById(id)
      .populate("userId", "name email")
      .populate({
        path: "resourceId",
        select: "name type",
        populate: { path: "type", select: "name -_id" },
      });

    if (!report)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo cáo sự cố",
        error: "NOT_FOUND",
      });
    if (
      req.user.role === "student" &&
      !report.userId._id.equals(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Không đủ quyền truy cập",
        error: "FORBIDDEN",
      });
    }
    return res.json({
      success: true,
      message: "Lấy chi tiết báo cáo sự cố thành công",
      data: report,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
