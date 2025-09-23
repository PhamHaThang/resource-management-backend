exports.validateCreateResourceType = (req, res, next) => {
  const { name, description } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Tên loại tài nguyên không được để trống",
    });
  }

  if (description && typeof description !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Mô tả không hợp lệ" });
  }

  next();
};
exports.validateUpdateResourceType = (req, res, next) => {
  const { name, description } = req.body;

  if (name && (typeof name !== "string" || name.trim().length === 0)) {
    return res.status(400).json({
      success: false,
      message: "Tên loại tài nguyên không được để trống",
    });
  }

  if (description && typeof description !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Mô tả không hợp lệ" });
  }

  next();
};
