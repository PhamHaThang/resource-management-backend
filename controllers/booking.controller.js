const Booking = require("../models/booking.model");
const Resource = require("../models/resource.model");
const { createNotificationForUser } = require("../utils/notification");
const { getPaginationAndFilter } = require("../utils/pagination");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");

const buildTimeConditions = (startDate, endDate) => {
  const conditions = [];

  if (startDate) {
    const start = new Date(startDate);
    if (!Number.isNaN(start.getTime())) {
      conditions.push({ endTime: { $gte: start } });
    }
  }

  if (endDate) {
    const end = new Date(endDate);
    if (!Number.isNaN(end.getTime())) {
      conditions.push({ startTime: { $lte: end } });
    }
  }

  return conditions;
};

const isSameDay = (start, end) =>
  start.getFullYear() === end.getFullYear() &&
  start.getMonth() === end.getMonth() &&
  start.getDate() === end.getDate();
// [POST] /api/bookings
exports.createBooking = asyncHandler(async (req, res) => {
  const { resourceId, startTime, endTime, purpose } = req.body;
  const userId = req.user._id;

  if (!resourceId || !startTime || !endTime) {
    throw new AppError(400, "Thiếu thông tin đặt lịch", "INVALID_PAYLOAD");
  }

  if (!mongoose.Types.ObjectId.isValid(resourceId)) {
    throw new AppError(400, "Tài nguyên không hợp lệ", "INVALID_RESOURCE_ID");
  }

  const resource = await Resource.findOne({
    _id: resourceId,
    deleted: false,
  });
  if (!resource) {
    throw new AppError(404, "Không tìm thấy tài nguyên", "RESOURCE_NOT_FOUND");
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AppError(400, "Thời gian không hợp lệ", "INVALID_TIME");
  }

  if (end <= start) {
    throw new AppError(
      400,
      "Thời gian kết thúc phải lớn hơn thời gian bắt đầu",
      "INVALID_TIME_RANGE"
    );
  }

  if (!isSameDay(start, end)) {
    throw new AppError(
      400,
      "Thời gian đặt phải trong cùng một ngày",
      "INVALID_TIME_RANGE"
    );
  }

  if (start < now) {
    throw new AppError(
      400,
      "Không thể đặt lịch trong quá khứ",
      "INVALID_TIME_RANGE"
    );
  }

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

  const queryFilter = { ...filter };
  if (req.user.role === "student") {
    queryFilter.userId = req.user._id;
  }

  const { startDate, endDate } = req.query;
  const timeConditions = buildTimeConditions(startDate, endDate);
  if (timeConditions.length > 0) {
    queryFilter.$and = [...(queryFilter.$and || []), ...timeConditions];
  }

  const total = await Booking.countDocuments(queryFilter);
  const bookings = await Booking.find(queryFilter)
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

// [GET] /api/bookings/calendar/public
exports.getCalendarPublic = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;

  if (!startDate || !endDate) {
    throw new AppError(400, "Cần startDate và endDate", "INVALID_TIME_RANGE");
  }

  const timeConditions = buildTimeConditions(startDate, endDate);

  if (timeConditions.length === 0) {
    throw new AppError(
      400,
      "Khoảng thời gian không hợp lệ",
      "INVALID_TIME_RANGE"
    );
  }

  const queryFilter = {
    status: status || "approved",
    $and: timeConditions,
  };

  const bookings = await Booking.find(queryFilter)
    .select("resourceId startTime endTime status")
    .populate({
      path: "resourceId",
      select: "name type",
      populate: { path: "type", select: "name" },
    })
    .sort({ startTime: 1 });

  return res.json({
    success: true,
    message: "Lấy lịch đặt thành công",
    data: { bookings },
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

  const hasStart = typeof updateData.startTime !== "undefined";
  const hasEnd = typeof updateData.endTime !== "undefined";

  if (hasStart !== hasEnd) {
    throw new AppError(
      400,
      "Cần cung cấp cả thời gian bắt đầu và kết thúc",
      "INVALID_TIME_RANGE"
    );
  }

  if (hasStart && hasEnd) {
    const start = new Date(updateData.startTime);
    const end = new Date(updateData.endTime);
    const now = new Date();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new AppError(400, "Thời gian không hợp lệ", "INVALID_TIME");
    }

    if (end <= start) {
      throw new AppError(
        400,
        "Thời gian kết thúc phải lớn hơn thời gian bắt đầu",
        "INVALID_TIME_RANGE"
      );
    }

    if (!isSameDay(start, end)) {
      throw new AppError(
        400,
        "Thời gian đặt phải trong cùng một ngày",
        "INVALID_TIME_RANGE"
      );
    }

    if (start < now) {
      throw new AppError(
        400,
        "Không thể đặt lịch trong quá khứ",
        "INVALID_TIME_RANGE"
      );
    }

    const conflictCount = await Booking.countDocuments({
      _id: { $ne: id },
      resourceId: currentBooking.resourceId,
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } },
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

  if (
    status === "approved" &&
    ["cancelled", "rejected"].includes(booking.status)
  ) {
    throw new AppError(
      400,
      "Booking đã bị huỷ hoặc từ chối nên không thể duyệt lại",
      "INVALID_STATUS_TRANSITION"
    );
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
