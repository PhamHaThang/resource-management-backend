const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { getPaginationAndFilter } = require("../utils/pagination");
// [GET] /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const allowedFilters = ["role", "status", "email"];
    const { filter, page, limit, skip } = getPaginationAndFilter(
      req.query,
      allowedFilters
    );
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .select("-password")
      .sort({
        createdAt: -1,
      });
    return res.json({
      success: true,
      message: "Lấy danh sách người dùng thành công",
      data: {
        total,
        page,
        limit,
        users,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [PUT] /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    if (req.file) {
      updateData.avatar = req.file.path;
    }
    if (updateData.email) {
      const existingUser = await User.findOne({
        _id: { $ne: req.user._id },
        email: updateData.email,
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email đã tồn tại",
          error: "EMAIL_DUPLICATE",
        });
      }
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select("-password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
        error: "NOT_FOUND",
      });
    }
    return res.json({
      success: true,
      message: "Cập nhật người dùng thành công",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [POST] /api/users
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, studentCode, role } = req.body;
    const avatar = req.file ? req.file.path : null;
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
      avatar,
      studentCode: role === "student" ? studentCode : "",
    });
    await newUser.save();
    return res.status(201).json({
      success: true,
      message: "Tạo user mới thành công",
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
// [DELETE] /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, deleted: false },
      { deleted: true },
      { new: true }
    );
    if (!user)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
        error: "NOT_FOUND",
      });
    return res.json({
      success: true,
      message: "Xóa user thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi server",
      error: error.message,
    });
  }
};
// [GET] /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
        error: "NOT_FOUND",
      });
    return res.json({
      success: true,
      message: "Lấy thông tin cá nhân thành công",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [PUT] /api/users/profile
exports.updateProfile = async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData.password;
    delete updateData.role;
    delete updateData.status;
    if (req.file) {
      updateData.avatar = req.file.path;
    }
    if (updateData.email) {
      const existingUser = await User.findOne({
        _id: { $ne: req.user._id },
        email: updateData.email,
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email đã tồn tại",
          error: "EMAIL_DUPLICATE",
        });
      }
    }
    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-password");
    if (!user)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
        error: "NOT_FOUND",
      });
    return res.json({
      success: true,
      message: "Cập nhật thành công",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [PUT] /api/users/profile/change-password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
        error: "NOT_FOUND",
      });
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
        error: "INVALID_PASSWORD",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    return res.json({
      success: true,
      message: "Đổi  mật khẩu thành công",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
