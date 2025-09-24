const Booking = require("../models/booking.model");
const { createNotificationForUser } = require("../utils/notification");
const { getPaginationAndFilter } = require("../utils/pagination");
// [POST] /api/bookings
exports.createBooking = async (req, res) => {
  try {
    const { resourceId, startTime, endTime, purpose } = req.body;
    const userId = req.user._id;

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
      .populate({
        path: "resourceId",
        populate: { path: "type", select: "name -_id" },
      })
      .populate("userId", "-password");
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
      .populate({
        path: "resourceId",
        populate: { path: "type", select: "name -_id" },
      })
      .populate("userId", "-password")
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
    delete updateData.userId;
    delete updateData.resourceId;
    const id = req.params.id;
    if (updateData.startTime && updateData.endTime) {
      const currentBooking = await Booking.findById(id);
      if (!currentBooking) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy booking",
          error: "NOT_FOUND",
        });
      }

      const conflictCount = await Booking.countDocuments({
        _id: { $ne: id },
        resourceId: currentBooking.resourceId,
        $or: [
          {
            startTime: {
              $lt: new Date(updateData.endTime),
              $gte: new Date(updateData.startTime),
            },
          },
          {
            endTime: {
              $gt: new Date(updateData.startTime),
              $lte: new Date(updateData.endTime),
            },
          },
          {
            startTime: { $lte: new Date(updateData.startTime) },
            endTime: { $gte: new Date(updateData.endTime) },
          },
        ],
        status: { $in: ["new", "approved"] },
      });

      if (conflictCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Thời gian đặt booking bị xung đột với booking khác",
          error: "TIME_CONFLICT",
        });
      }
    }
    const booking = await Booking.findByIdAndUpdate(id, updateData, {
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
    const isOwner = booking.userId.equals(req.user._id);
    const isAdmin = req.user.role === "admin";
    if (!isOwner || !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Không đủ quyền hủy booking này",
        error: "FORBIDDEN",
      });
    }
    await createNotificationForUser(
      booking.userId._id,
      "Booking đã được hủy",
      `Booking của bạn đã hủy thành công`,
      "booking",
      booking._id
    );
    booking.status = "cancelled";
    await booking.save();
    return res.json({
      success: false,
      message: "Booking đã được hủy",
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
