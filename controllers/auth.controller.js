const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const crypto = require("crypto");
const { sendEmail } = require("../utils/sendMail");
require("dotenv").config();

// [POST] /api/auth/register
exports.register = async (req, res) => {
  const { name, email, phone, password, studentCode, role } = req.body;
  try {
    const existingUser = await User.findOne({
      email,
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đã tồn tại",
        error: "EMAIL_EXISTS",
      });
    }
    const allowedRoles = ["student", "teacher"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role không hợp lệ",
        error: "INVALID_ROLE",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: passwordHash,
      role,
      phone,
      studentCode: role === "student" ? studentCode : "",
    });
    await newUser.save();
    return res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      data: {
        id: newUser._id,
        name,
        email,
        role,
        phone,
        studentCode,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
// [POST] /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email không đúng",
        error: "INVALID_EMAIL",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu không đúng",
        error: "INVALID_PASSWORD",
      });
    }

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "12h",
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
// [POST] /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.status !== "active" || user.deleted) {
      return res.status(404).json({
        success: false,
        message: "Tài khoản không tồn tại hoặc đã bị khóa",
        error: "NOT_FOUND",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrlBase = process.env.FRONTEND_RESET_PASSWORD_URL;
    const resetUrl = `${resetUrlBase}?token=${resetToken}`;
    const html = `<p>Chào bạn,</p>
      <p>Vui lòng nhấn vào <a href="${resetUrl}">đây</a> để đặt lại mật khẩu. Link có hiệu lực trong 1 giờ.</p>`;

    await sendEmail(email, "Đặt lại mật khẩu", html);

    return res.json({
      success: true,
      message: "Gửi email đặt lại mật khẩu thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [POST] /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Token không hợp lệ hoặc đã hết hạn",
        error: "INVALID_TOKEN",
      });
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
