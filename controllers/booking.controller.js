const Booking = require("../models/booking.model");
const { createNotificationForUser } = require("../utils/notification");
const { getPaginationAndFilter } = require("../utils/pagination");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");
const Resource = require("../models/resource.model");
// [POST] /api/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const { resourceId, startTime, endTime, purpose } = req.body;
  const userId = req.user._id;
  const resource = await Resource.findOne({
    _id: resourceId,
    deleted: false,
  });
  if (!resource) {
    throw new AppError(404, "Không tìm thấy tài nguyên", "RESOURCE_NOT_FOUND");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const overlappingBooking = await Booking.findOne({
    resourceId,
    status: { $in: ["pending", "approved"] },
    $or: [
      { startTime: { $lt: end, $gte: start } },
      { endTime: { $gt: start, $lte: end } },
      {
        startTime: { $lte: start },
        endTime: { $gte: end },
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
    startTime: start,
    endTime: end,
    purpose: typeof purpose === "string" ? purpose.trim() : "",
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
  const currentBooking = await Booking.findById(id);
  if (!currentBooking) {
    throw new AppError(404, "Không tìm thấy booking", "NOT_FOUND");
  }
  const start = new Date(updateData.startTime);
  const end = new Date(updateData.endTime);
  const conflictCount = await Booking.countDocuments({
    _id: { $ne: id },
    resourceId: currentBooking.resourceId,
    $or: [
      {
        startTime: {
          $lt: end,
          $gte: start,
        },
      },
      {
        endTime: {
          $gt: start,
          $lte: end,
        },
      },
      {
        startTime: { $lte: start },
        endTime: { $gte: end },
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
  updateData.startTime = start;
  updateData.endTime = end;
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

  const booking = await Booking.findById(id);
  if (!booking) {
    throw new AppError(404, "Không tìm thấy đặt lịch", "NOT_FOUND");
  }
  if (status === booking.status) {
    return res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: booking,
    });
  }

  if (status === "approved") {
    const conflict = await Booking.findOne({
      _id: { $ne: booking._id },
      resourceId: booking.resourceId,
      status: "approved",
      $or: [
        {
          startTime: { $lt: booking.endTime, $gte: booking.startTime },
        },
        {
          endTime: { $gt: booking.startTime, $lte: booking.endTime },
        },
        {
          startTime: { $lte: booking.startTime },
          endTime: { $gte: booking.endTime },
        },
      ],
    });
    if (conflict) {
      throw new AppError(
        400,
        "Khoảng thời gian này đã có booking được phê duyệt",
        "TIME_CONFLICT"
      );
    }
  }
  const updateData = { status };
  if (status === "rejected" && rejectReason) {
    updateData.rejectReason = rejectReason;
  } else {
    updateData.rejectReason = "";
  }
  const updatedBooking = await Booking.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!updatedBooking) {
    throw new AppError(404, "Không tìm thấy đặt lịch", "NOT_FOUND");
  }
  const recipientId =
    updatedBooking.userId instanceof mongoose.Types.ObjectId
      ? updatedBooking.userId
      : updatedBooking.userId._id;
  await createNotificationForUser(
    recipientId,
    "Trạng thái booking thay đổi",
    `Booking của bạn đã chuyển sang trạng thái: ${status}`,
    "booking",
    updatedBooking._id
  );
  return res.json({
    success: true,
    message: "Cập nhật trạng thái thành công",
    data: updatedBooking,
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
  if (["cancelled", "rejected"].includes(booking.status)) {
    return res.json({
      success: true,
      message: "Booking đã được cập nhật trước đó",
      data: booking,
    });
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
    success: true,
    message: "Booking đã được hủy",
    data: booking,
  });
});
