exports.validateCreateBooking = (req, res, next) => {
  const { resourceId, startTime, endTime } = req.body;

  if (
    !resourceId ||
    typeof resourceId !== "string" ||
    resourceId.trim() === ""
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Tài nguyên đặt không được để trống" });
  }

  if (!startTime || isNaN(Date.parse(startTime))) {
    return res
      .status(400)
      .json({ success: false, message: "Thời gian bắt đầu không hợp lệ" });
  }

  if (!endTime || isNaN(Date.parse(endTime))) {
    return res
      .status(400)
      .json({ success: false, message: "Thời gian kết thúc không hợp lệ" });
  }

  if (new Date(startTime) >= new Date(endTime)) {
    return res.status(400).json({
      success: false,
      message: "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
    });
  }

  next();
};
exports.validateUpdateBooking = (req, res, next) => {
  const { startTime, endTime, status } = req.body;
  console.log("ok");

  if (startTime !== undefined) {
    if (typeof startTime !== "string" || startTime.trim() === "") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Thời gian bắt đầu không được để trống",
        });
    }
    if (isNaN(Date.parse(startTime))) {
      return res
        .status(400)
        .json({ success: false, message: "Thời gian bắt đầu không hợp lệ" });
    }
  }

  if (endTime !== undefined) {
    if (typeof endTime !== "string" || endTime.trim() === "") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Thời gian kết thúc không được để trống",
        });
    }
    if (isNaN(Date.parse(endTime))) {
      return res
        .status(400)
        .json({ success: false, message: "Thời gian kết thúc không hợp lệ" });
    }
  }

  if (startTime !== undefined && endTime !== undefined) {
    if (new Date(startTime) >= new Date(endTime)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc",
        });
    }
  }

  const validStatuses = ["pending", "approved", "rejected", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    return res
      .status(400)
      .json({ success: false, message: "Trạng thái booking không hợp lệ" });
  }

  next();
};
exports.validateUpdateBookingStatus = (req, res, next) => {
  const { status } = req.body;

  const validStatuses = ["pending", "approved", "rejected", "cancelled"];
  if (status && !validStatuses.includes(status)) {
    return res
      .status(400)
      .json({ success: false, message: "Trạng thái booking không hợp lệ" });
  }

  next();
};
