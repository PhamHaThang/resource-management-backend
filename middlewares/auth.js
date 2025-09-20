const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

exports.authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
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
    console.log(payload);
    const user = await User.findById(payload.userId);
    if (!user || user.status !== "active" || user.deleled) {
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
