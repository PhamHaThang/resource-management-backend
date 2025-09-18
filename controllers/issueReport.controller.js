const { getPaginationAndFilter } = require("../utils/pagination");
const IssueReport = require("../models/issueReport.model");
// [POST] /api/issue-reports
exports.createIssueReport = async (req, res) => {
  try {
    const { userId, resourceId, title, description } = req.body;
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
    const allowedFilters = ["userId", "resourceId", "status"];
    const { filter, page, limit, skip } = getPaginationAndFilter(
      req.query,
      allowedFilters
    );

    const total = await IssueReport.countDocuments(filter);

    const reports = await IssueReport.find(filter)
      .populate("userId", "name email")
      .populate("resourceId", "name type")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    return res.status(200).json({
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
    return res.status(200).json({
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
