exports.validateCreateResource = (req, res, next) => {
  const { name, type, description } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Tên tài nguyên không được để trống" });
  }

  if (!type || typeof type !== "string" || type.trim().length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Loại tài nguyên không được để trống" });
  }

  if (description && typeof description !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Mô tả không hợp lệ" });
  }

  next();
};
exports.validateUpdateResource = (req, res, next) => {
  const { name, type, description } = req.body;

  if (name && (typeof name !== "string" || name.trim().length === 0)) {
    return res
      .status(400)
      .json({ success: false, message: "Tên tài nguyên không được để trống" });
  }

  if (type && (typeof type !== "string" || type.trim().length === 0)) {
    return res
      .status(400)
      .json({ success: false, message: "Loại tài nguyên không được để trống" });
  }

  if (description && typeof description !== "string") {
    return res
      .status(400)
      .json({ success: false, message: "Mô tả không hợp lệ" });
  }

  next();
};
