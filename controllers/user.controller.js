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
    return res.status(200).json({
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

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    }).select("-passwordHash");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
        error: "NOT_FOUND",
      });
    }
    return res.status(200).json({
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
// [PUT] /api/users/:id/status
exports.toggleUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
        error: "INVALID_STATUS",
      });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
      }
    ).select("-passwordHash");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
        error: "NOT_FOUND",
      });
    }
    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái thành ${status}`,
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
// [GET] /api/users/profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");
    if (!user)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
        error: "NOT_FOUND",
      });
    return res.status(200).json({
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
    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
    }).select("-passwordHash");
    if (!user)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
        error: "NOT_FOUND",
      });
    return res.status(200).json({
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
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin mật khẩu",
        error: "BAD_REQUEST",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy user",
        error: "NOT_FOUND",
      });
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu hiện tại không đúng",
        error: "INVALID_PASSWORD",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Đổi  mật khẩu thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
