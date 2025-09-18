const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
// [POST] /api/auth/register
exports.register = async (req, res) => {
  const { name, email, phone, role, password, studentCode } = req.body;
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
    return res.status(200).json({
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
