const e = require("express");

exports.validateCreateResource = (req, res, next) => {
  const { name, type, description } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Tên tài nguyên không được để trống",
        error: "NAME_REQUIRED",
      });
  }

  if (!type || typeof type !== "string" || type.trim().length === 0) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Loại tài nguyên không được để trống",
        error: "TYPE_REQUIRED",
      });
  }

  if (description && typeof description !== "string") {
    return res
      .status(400)
      .json({
        success: false,
        message: "Mô tả không hợp lệ",
        error: "DESCRIPTION_INVALID",
      });
  }

  next();
};
exports.validateUpdateResource = (req, res, next) => {
  const { name, type, description } = req.body;

  if (name && (typeof name !== "string" || name.trim().length === 0)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Tên tài nguyên không được để trống",
        error: "NAME_REQUIRED",
      });
  }

  if (type && (typeof type !== "string" || type.trim().length === 0)) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Loại tài nguyên không được để trống",
        error: "TYPE_REQUIRED",
      });
  }

  if (description && typeof description !== "string") {
    return res
      .status(400)
      .json({
        success: false,
        message: "Mô tả không hợp lệ",
        error: "DESCRIPTION_INVALID",
      });
  }

  next();
};
