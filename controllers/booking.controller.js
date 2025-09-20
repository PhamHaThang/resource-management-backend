const Booking = require("../models/booking.model");
const { createNotificationForUser } = require("../utils/notification");
const { getPaginationAndFilter } = require("../utils/pagination");
// [POST] /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { resourceId, startTime, endTime, purpose } = req.body;
    const userId = req.user._id;

    if (new Date(startTime) >= new Date(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
        error: "INVALID_TIME",
      });
    }

    const overlappingBooking = await Booking.findOne({
      resourceId,
      status: { $in: ["pending", "approved"] },
      $or: [
        { startTime: { $lt: new Date(endTime), $gte: new Date(startTime) } },
        { endTime: { $gt: new Date(startTime), $lte: new Date(endTime) } },
        {
          startTime: { $lte: new Date(startTime) },
          endTime: { $gte: new Date(endTime) },
        },
      ],
    });
    if (overlappingBooking) {
      return res.status(400).json({
        success: false,
        message: "Tài nguyên đã được đặt trong khoảng thời gian này",
        error: "TIME_CONFLICT",
      });
    }

    const booking = new Booking({
      userId,
      resourceId,
      startTime,
      endTime,
      purpose,
    });
    await booking.save();

    return res.status(201).json({
      success: true,
      message: "Đặt lịch thành công",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [GET] /api/bookings/:id
exports.getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("resourceId")
      .populate("userId");
    if (!booking)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
        error: "NOT_FOUND",
      });

    if (req.user.role === "student" && !booking.userId.equals(req.user._id)) {
      return res.status(404).json({
        success: false,
        message: "Không đủ quyền truy cập booking này",
        error: "NOT_FOUND",
      });
    }
    return res.json({
      success: true,
      message: "Lấy thông tin chi tiết thành công",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lấy thông tin chi tiết thành công",
      error: error.message,
    });
  }
};
// [GET] /api/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const allowedFilters = ["resourceId", "status"];

    const { filter, page, limit, skip } = getPaginationAndFilter(
      req.query,
      allowedFilters
    );
    if (req.user.role === "student") {
      filter.userId = req.user._id;
    }
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate("resourceId")
      .populate("userId")
      .skip(skip)
      .limit(limit)
      .sort({ startTime: -1 });
    return res.json({
      success: true,
      message: "Lấy danh sách booking thành công",
      data: {
        total,
        page,
        limit,
        bookings,
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
// [PUT] /api/bookings/:id
exports.updateBooking = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.status) {
      const validStatuses = ["new", "approved", "rejected", "cancelled"];
      if (!validStatuses.includes(updateData.status)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
          error: "INVALID_STATUS",
        });
      }
    }

    const booking = await Booking.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });
    if (!booking)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
        error: "NOT_FOUND",
      });
    return res.json({
      success: true,
      message: "Cập nhật booking thành công",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [PUT] /api/bookings/:id/status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    if (!["pending", "approved", "rejected", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
        error: "INVALID_STATUS",
      });
    }
    const updateData = { status };
    if (status === "rejected" && rejectReason) {
      updateData.rejectReason = rejectReason;
    } else {
      updateData.rejectReason = "";
    }
    const booking = await Booking.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt lịch",
        error: "NOT_FOUND",
      });
    }
    await createNotificationForUser(
      booking.userId._id,
      "Trạng thái booking thay đổi",
      `Booking của bạn đã chuyển sang trạng thái: ${status}`,
      "booking",
      booking._id
    );
    return res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [DELETE] /api/bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
        error: "NOT_FOUND",
      });
    return res.json({
      success: true,
      message: "Xóa booking thành công",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [PUT] /api/bookings/:id/cancel
exports.cancelBookingByUser = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking)
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy booking",
        error: "NOT_FOUND",
      });
    if (!booking.userId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Không đủ quyền hủy booking này",
        error: "FORBIDDEN",
      });
    }

    booking.status = "cancelled";
    await booking.save();
    return res.json({
      success: false,
      message: "Booking đã được hủy",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
