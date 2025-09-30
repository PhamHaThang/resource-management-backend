const asyncHandler = require("express-async-handler");
const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const { getPaginationAndFilter } = require("../utils/pagination");
const AppError = require("../utils/AppError");

// [GET] /api/users
exports.getAllUsers = asyncHandler(async (req, res) => {
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
});

// [PUT] /api/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  const removeAvatar = updateData.removeAvatar === "true";
  delete updateData.removeAvatar;
  if (updateData.password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(updateData.password, salt);
  }
  if (req.file) {
    updateData.avatar = req.file.path;
  } else if (removeAvatar) {
    updateData.avatar = "";
  }
  if (updateData.email) {
    const existingUser = await User.findOne({
      _id: { $ne: req.user._id },
      email: updateData.email,
    });
    if (existingUser) {
      throw new AppError(400, "Email đã tồn tại", "EMAIL_DUPLICATE");
    }
  }
  const user = await User.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
  }).select("-password");
  if (!user) {
    throw new AppError(404, "Không tìm thấy người dùng", "NOT_FOUND");
  }
  return res.json({
    success: true,
    message: "Cập nhật người dùng thành công",
    data: user,
  });
});

// [POST] /api/users
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, studentCode, role } = req.body;
  const avatar = req.file ? req.file.path : null;
  const existingUser = await User.findOne({
    email,
  });
  if (existingUser) {
    throw new AppError(400, "Email đã tồn tại", "EMAIL_EXISTS");
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
});

// [DELETE] /api/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, deleted: false },
    { deleted: true },
    { new: true }
  );
  if (!user) throw new AppError(404, "Không tìm thấy user", "NOT_FOUND");
  return res.json({
    success: true,
    message: "Xóa user thành công",
  });
});

// [GET] /api/users/profile
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) throw new AppError(404, "Không tìm thấy user", "NOT_FOUND");
  return res.json({
    success: true,
    message: "Lấy thông tin cá nhân thành công",
    data: user,
  });
});

// [PUT] /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  const removeAvatar = updateData.removeAvatar === "true";
  delete updateData.removeAvatar;
  delete updateData.password;
  delete updateData.role;
  delete updateData.status;
  if (req.file) {
    updateData.avatar = req.file.path;
  } else if (removeAvatar) {
    updateData.avatar = "";
  }
  if (updateData.email) {
    const existingUser = await User.findOne({
      _id: { $ne: req.user._id },
      email: updateData.email,
    });
    if (existingUser) {
      throw new AppError(400, "Email đã tồn tại", "EMAIL_EXISTS");
    }
  }
  const user = await User.findByIdAndUpdate(req.user._id, updateData, {
    new: true,
  }).select("-password");
  if (!user) throw new AppError(404, "Không tìm thấy user", "NOT_FOUND");
  return res.json({
    success: true,
    message: "Cập nhật thành công",
    data: user,
  });
});

// [PUT] /api/users/profile/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError(404, "Không tìm thấy user", "NOT_FOUND");
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError(400, "Mật khẩu hiện tại không đúng", "INVALID_PASSWORD");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();
  return res.json({
    success: true,
    message: "Đổi  mật khẩu thành công",
  });
});
