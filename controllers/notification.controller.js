const Notification = require("../models/notification.model");
// [GET] /api/notifications
exports.getNotifications = async (req, res) => {
  try {
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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [GET] /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notif = await Notification.findOne({ _id: id, userId: req.user._id });
    if (!notif)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
        error: "NOT_FOUND",
      });
    notif.isRead = true;
    await notif.save();
    return res.json({
      success: true,
      message: "Đã đánh dấu thông báo đã đọc",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
