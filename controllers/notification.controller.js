const Notification = require("../models/notification.model");
const AppError = require("../utils/AppError");
const asyncHandler = require("express-async-handler");
// [GET] /api/notifications
exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10, isRead } = req.query;
  const filter = { userId };
  if (isRead === "true") filter.isRead = true;
  else if (isRead === "false") filter.isRead = false;
  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const total = await Notification.countDocuments(filter);
  return res.json({
    success: true,
    message: "Lấy danh sách thông báo thành công",
    data: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      notifications,
    },
  });
});

// [GET] /api/notifications/:id/read
exports.markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notif = await Notification.findOne({ _id: id, userId: req.user._id });
  if (!notif) throw new AppError(404, "Không tìm thấy thông báo", "NOT_FOUND");

  notif.isRead = true;
  await notif.save();
  return res.json({
    success: true,
    message: "Đã đánh dấu thông báo đã đọc",
  });
});
