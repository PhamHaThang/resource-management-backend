const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { isValidEmail } = require("../utils/validate");
exports.authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
      error: "UNAUTHORIZED",
    });
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId);
    if (!user || user.status !== "active" || user.deleted) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản bị khóa hoặc không tồn tại",
        error: "UNAUTHORIZED",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token hết hạn hoặc sai",
      error: "UNAUTHORIZED",
    });
  }
};

exports.requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
        error: "FORBIDDEN",
      });
    }
    next();
  };
};
exports.validateRegister = (req, res, next) => {
  const { name, email, password, role, studentCode } = req.body;

  if (!name || typeof name !== "string" || name.trim().length < 3) {
    return res
      .status(400)
      .json({ success: false, message: "Tên phải ít nhất 3 ký tự" });
  }

  if (!email || !isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Email không hợp lệ" });
  }

  if (!password || typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ success: false, message: "Mật khẩu phải từ 6 ký tự trở lên" });
  }
  if (role === "student") {
    if (
      !studentCode ||
      typeof studentCode !== "string" ||
      studentCode.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Mã sinh viên không được để trống" });
    }
  }

  next();
};
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Email không hợp lệ" });
  }

  if (!password || typeof password !== "string" || password.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Mật khẩu không được để trống" });
  }

  next();
};
exports.validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!email || !isValidEmail(email)) {
    return res
      .status(400)
      .json({ success: false, message: "Email không hợp lệ" });
  }

  next();
};

exports.validateResetPassword = (req, res, next) => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== "string" || token.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Token không hợp lệ" });
  }

  if (
    !newPassword ||
    typeof newPassword !== "string" ||
    newPassword.length < 6
  ) {
    return res.status(400).json({
      success: false,
      message: "Mật khẩu mới phải từ 6 ký tự trở lên",
    });
  }

  next();
};
