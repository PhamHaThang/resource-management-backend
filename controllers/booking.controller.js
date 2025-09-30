const Booking = require("../models/booking.model");
const { createNotificationForUser } = require("../utils/notification");
const { getPaginationAndFilter } = require("../utils/pagination");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");
// [POST] /api/bookings
exports.createBooking = asyncHandler(async (req, res) => {
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
    throw new AppError(
      400,
      "Tài nguyên đã được đặt trong khoảng thời gian này",
      "TIME_CONFLICT"
    );
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
});

// [GET] /api/bookings/:id
exports.getBookingDetail = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate({
      path: "resourceId",
      populate: { path: "type", select: "name -_id" },
    })
    .populate("userId", "-password");
  if (!booking) throw new AppError(404, "Không tìm thấy booking", "NOT_FOUND");
  const isOwner = booking.userId.equals(req.user._id);
  if (req.user.role === "student" && !isOwner) {
    throw new AppError(403, "Không đủ quyền truy cập booking này", "FORBIDDEN");
  }
  return res.json({
    success: true,
    message: "Lấy thông tin chi tiết thành công",
    data: booking,
  });
});

// [GET] /api/bookings
exports.getAllBookings = asyncHandler(async (req, res) => {
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
});

// [PUT] /api/bookings/:id
exports.updateBooking = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };
  delete updateData.userId;
  delete updateData.resourceId;
  const id = req.params.id;
  if (updateData.startTime && updateData.endTime) {
    const currentBooking = await Booking.findById(id);
    if (!currentBooking) {
      throw new AppError(404, "Không tìm thấy booking", "NOT_FOUND");
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
      status: { $in: ["pending", "approved"] },
    });

    if (conflictCount > 0) {
      throw new AppError(
        400,
        "Thời gian đặt booking bị xung đột với booking khác",
        "TIME_CONFLICT"
      );
    }
  }
  const booking = await Booking.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!booking) throw new AppError(404, "Không tìm thấy booking", "NOT_FOUND");

  return res.json({
    success: true,
    message: "Cập nhật booking thành công",
    data: booking,
  });
});

// [PUT] /api/bookings/:id/status
exports.updateBookingStatus = asyncHandler(async (req, res) => {
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
    throw new AppError(404, "Không tìm thấy đặt lịch", "NOT_FOUND");
  }
  const recipientId =
    booking.userId instanceof mongoose.Types.ObjectId
      ? booking.userId
      : booking.userId._id;
  await createNotificationForUser(
    recipientId,
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
});

// [DELETE] /api/bookings/:id
exports.deleteBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findByIdAndDelete(id);
  if (!booking) throw new AppError(404, "Không tìm thấy booking", "NOT_FOUND");

  return res.json({
    success: true,
    message: "Xóa booking thành công",
  });
});

// [PUT] /api/bookings/:id/cancel
exports.cancelBookingByUser = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw new AppError(404, "Không tìm thấy booking", "NOT_FOUND");

  const isOwner = booking.userId.equals(req.user._id);
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin) {
    throw new AppError(403, "Không đủ quyền hủy booking này", "FORBIDDEN");
  }
  const recipientId =
    booking.userId instanceof mongoose.Types.ObjectId
      ? booking.userId
      : booking.userId._id;
  await createNotificationForUser(
    recipientId,
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
});
