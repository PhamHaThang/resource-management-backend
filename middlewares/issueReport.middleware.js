exports.validateCreateIssueReport = (req, res, next) => {
  const { title, description, resourceId } = req.body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Tiêu đề báo cáo không được để trống" });
  }

  if (
    !description ||
    typeof description !== "string" ||
    description.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Nội dung báo cáo không được để trống",
    });
  }

  if (
    !resourceId ||
    typeof resourceId !== "string" ||
    resourceId.trim().length === 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Tài nguyên liên quan không được để trống",
    });
  }

  next();
};
exports.validateUpdateIssueReportStatus = (req, res, next) => {
  const { status } = req.body;
  if (status) {
    const validStatuses = ["new", "in_progress", "resolved", "closed"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Trạng thái không hợp lệ" });
    }
  }

  next();
};
