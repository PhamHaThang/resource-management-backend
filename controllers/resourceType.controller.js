const ResourceType = require("../models/resourceType.model");
const { getPaginationAndFilter } = require("../utils/pagination");
const AppError = require("../utils/AppError");
const asyncHandler = require("express-async-handler");
// [POST] /api/resource-types
exports.createResourceType = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const existing = await ResourceType.findOne({ name });
  if (existing)
    throw new AppError(400, "Loại tài nguyên đã tồn tại", "DUPLICATE");
  const resourceType = new ResourceType({ name, description });
  await resourceType.save();
  return res.status(201).json({
    success: true,
    message: "Tạo loại tài nguyên thành công",
    data: resourceType,
  });
});

// [GET] /api/resource-types
exports.getAllResourceTypes = asyncHandler(async (req, res) => {
  const allowedFilters = ["name"];
  const { filter, page, limit, skip } = getPaginationAndFilter(
    req.query,
    allowedFilters
  );
  if (filter.name) {
    filter.name = { $regex: filter.name, $options: "i" };
  }
  const total = await ResourceType.countDocuments(filter);
  const resourceTypes = await ResourceType.find(filter)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  return res.json({
    success: true,
    message: "Lấy danh sách loại tài nguyên thành công",
    data: {
      total,
      page,
      limit,
      resourceTypes,
    },
  });
});

// [PUT] /api/resource-types/:id
exports.updateResourceType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const resourceType = await ResourceType.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!resourceType)
    throw new AppError(404, "Không tìm thấy loại tài nguyên", "NOT_FOUND");
  return res.json({
    success: true,
    message: "Cập nhật loại tài nguyên thành công",
    data: resourceType,
  });
});

// [DELETE] /api/resource-types/:id
exports.deleteResourceType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const resourceType = await ResourceType.findByIdAndDelete(id);
  if (!resourceType)
    throw new AppError(404, "Không tìm thấy loại tài nguyên", "NOT_FOUND");
  return res.json({
    success: true,
    message: "Xóa loại tài nguyên thành công",
  });
});
