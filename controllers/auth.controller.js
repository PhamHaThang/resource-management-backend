const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const crypto = require("crypto");
const { sendMail } = require("../utils/sendMail");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
require("dotenv").config();

// [POST] /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, studentCode, role } = req.body;
  const avatar = req.file ? req.file.path : null;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(400, "Email đã tồn tại", "EMAIL_EXISTS");
  }
  const allowedRoles = ["student", "teacher"];
  if (!allowedRoles.includes(role)) {
    throw new AppError(400, "Role không hợp lệ", "INVALID_ROLE");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = new User({
    name,
    email,
    password: passwordHash,
    role,
    phone,
    avatar,
    studentCode: role === "student" ? studentCode : "",
  });
  await newUser.save();
  return res.status(201).json({
    success: true,
    message: "Đăng ký thành công",
    data: newUser,
  });
});

// [POST] /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(400, "Email không đúng", "INVALID_EMAIL");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError(400, "Mật khẩu không đúng", "INVALID_PASSWORD");
  }

  const payload = { userId: user._id, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
  return res.json({
    success: true,
    message: "Đăng nhập thành công",
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentCode: user.studentCode,
        status: user.status,
      },
    },
  });
});

// [POST] /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.status !== "active" || user.deleted) {
    throw new AppError(
      404,
      "Tài khoản không tồn tại hoặc đã bị khóa",
      "NOT_FOUND"
    );
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 3600000;
  await user.save();

  const resetUrlBase = process.env.FRONTEND_RESET_PASSWORD_URL;
  const resetUrl = `${resetUrlBase}?token=${resetToken}`;
  const html = `<p>Chào bạn,</p>
    <p>Vui lòng nhấn vào <a href="${resetUrl}">đây</a> để đặt lại mật khẩu. Link có hiệu lực trong 1 giờ.</p>`;

  await sendMail(email, "Đặt lại mật khẩu", html);

  return res.json({
    success: true,
    message: "Gửi email đặt lại mật khẩu thành công",
  });
});

// [POST] /api/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    throw new AppError(
      400,
      "Token không hợp lệ hoặc đã hết hạn",
      "INVALID_TOKEN"
    );
  }
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return res.json({
    success: true,
    message: "Đổi mật khẩu thành công",
  });
});
