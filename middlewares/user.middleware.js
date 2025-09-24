const { isValidEmail } = require("../utils/validate");

exports.validateUpdateProfile = (req, res, next) => {
  const { name, email, phone } = req.body;

  if (name && (typeof name !== "string" || name.trim().length < 3)) {
    return res.status(400).json({
      success: false,
      message: "Tên phải ít nhất 3 ký tự",
      error: "INVALID_NAME",
    });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Email không hợp lệ",
      error: "INVALID_EMAIL",
    });
  }

  if (phone && (typeof phone !== "string" || phone.trim().length < 10)) {
    return res.status(400).json({
      success: false,
      message: "Số điện thoại phải ít nhất 10 số",
      error: "INVALID_PHONE",
    });
  }

  next();
};
exports.validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (
    !currentPassword ||
    typeof currentPassword !== "string" ||
    currentPassword.trim() === ""
  ) {
    return res.status(400).json({
      success: false,
      message: "Mật khẩu hiện tại không được để trống",
      error: "CURRENT_PASSWORD_REQUIRED",
    });
  }

  if (
    !newPassword ||
    typeof newPassword !== "string" ||
    newPassword.length < 6
  ) {
    return res.status(400).json({
      success: false,
      message: "Mật khẩu mới phải từ 6 ký tự trở lên",
      error: "INVALID_NEW_PASSWORD",
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: "Mật khẩu mới phải khác mật khẩu hiện tại",
      error: "SAME_AS_CURRENT_PASSWORD",
    });
  }

  next();
};
exports.validateCreateUser = (req, res, next) => {
  const { name, email, password, role, studentCode } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: "Tên phải ít nhất 3 ký tự",
      error: "INVALID_NAME",
    });
  }

  if (!email || !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Email không hợp lệ",
      error: "INVALID_EMAIL",
    });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Mật khẩu phải từ 6 ký tự trở lên",
      error: "INVALID_PASSWORD",
    });
  }

  const validRoles = ["student", "teacher", "admin"];
  if (role) {
    if (!validRoles.includes(role))
      return res
        .status(400)
        .json({ success: false, message: "Role không hợp lệ" });
    if (
      role === "student" &&
      (!studentCode ||
        typeof studentCode !== "string" ||
        studentCode.trim().length === 0)
    )
      return res.status(400).json({
        success: false,
        message: "Mã sinh viên không được để trống",
        error: "STUDENT_CODE_REQUIRED",
      });
  }

  next();
};
exports.validateUpdateUser = (req, res, next) => {
  const { name, email, role, studentCode } = req.body;

  if (name && (typeof name !== "string" || name.trim().length < 3)) {
    return res.status(400).json({
      success: false,
      message: "Tên phải ít nhất 3 ký tự",
      error: "INVALID_NAME",
    });
  }

  if (email && !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Email không hợp lệ",
      error: "INVALID_EMAIL",
    });
  }

  const validRoles = ["admin", "teacher", "student"];
  if (role) {
    if (!validRoles.includes(role))
      return res.status(400).json({
        success: false,
        message: "Role không hợp lệ",
        error: "INVALID_ROLE",
      });
    if (
      role === "student" &&
      (!studentCode ||
        typeof studentCode !== "string" ||
        studentCode.trim().length === 0)
    )
      return res.status(400).json({
        success: false,
        message: "Mã sinh viên không được để trống",
        error: "STUDENT_CODE_REQUIRED",
      });
  }

  next();
};
