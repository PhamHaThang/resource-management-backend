const Booking = require("../models/booking.model");
const IssueReport = require("../models/issueReport.model");
const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
// [GET] /api/dashboard/booking-stats
exports.getBookingStats = asyncHandler(async (req, res) => {
  const stats = await Booking.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
      },
    },
  ]);
  return res.json({
    success: true,
    message: "Lấy thống kê booking theo trạng thái thành công",
    data: stats,
  });
});

// [GET] /api/dashboard/issue-report-stats
exports.getIssueReportStats = asyncHandler(async (req, res) => {
  const stats = await IssueReport.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
      },
    },
  ]);
  return res.json({
    success: true,
    message: "Lấy thống kê báo cáo sự cố theo trạng thái thành công",
    data: stats,
  });
});

// [GET] /api/dashboard/booking-stats-by-date
exports.getBookingStatsByDate = asyncHandler(async (req, res) => {
  const { fromDate, toDate } = req.query;
  const match = {};
  if (fromDate || toDate) {
    match.createdAt = {};
    if (fromDate) {
      match.createdAt.$gte = new Date(fromDate);
    }
    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      match.createdAt.$lte = endDate;
    }
  }
  const stats = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          $dateToString: { format: "%d-%m-%Y", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: "$_id",
        count: 1,
      },
    },
    { $sort: { date: 1 } },
  ]);
  return res.json({
    success: true,
    message: "Lấy thống kê booking theo ngày thành công",
    data: stats,
  });
});
