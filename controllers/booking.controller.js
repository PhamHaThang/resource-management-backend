const Booking = require("../models/booking.model");
const { getPaginationAndFilter } = require("../utils/pagination");
// [POST] /api/booking
exports.createBooking = async (req, res) => {
  try {
    const { userId, resourceId, startTime, endTime, purpose } = req.body;

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

    const booking = new Booking({ userId, resourceId, startTime, endTime });
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
// [GET] /api/booking/user/:userId
exports.getBookingsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const bookings = await Booking.find({ userId })
      .populate("resourceId")
      .sort({ startTime: -1 });
    return res.status(200).json({
      success: true,
      message: "Lấy lịch sử đặt phòng thành công",
      data: bookings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};
// [GET] /api/booking
exports.getAllBookings = async (req, res) => {
  try {
    const allowedFilters = ["userId", "resourceId", "status"];

    const { filter, page, limit, skip } = getPaginationAndFilter(
      req.query,
      allowedFilters
    );
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate("resourceId")
      .populate("userId")
      .skip(skip)
      .limit(limit)
      .sort({ startTime: -1 });
    return res.status(200).json({
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
// [PIT] /api/booking/:id/status
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

    return res.status(200).json({
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
