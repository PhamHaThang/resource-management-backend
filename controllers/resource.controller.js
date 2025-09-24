const Resource = require("../models/resource.model");
const ResourceType = require("../models/resourceType.model");
const QRCode = require("qrcode");
const { getPaginationAndFilter } = require("../utils/pagination");
const AppError = require("../utils/AppError");
const asyncHandler = require("express-async-handler");
// [POST] /api/resources
exports.createResource = asyncHandler(async (req, res) => {
  const { name, type, description, usageRules, capacity, location, status } =
    req.body;
  const typeExists = await ResourceType.findById(type);
  if (!typeExists) {
    throw new AppError(404, "Loại tài nguyên không tồn tại", "NOT_FOUND");
  }
  const images = req.files ? req.files.map((file) => file.path) : [];
  const newResource = new Resource({
    name,
    type,
    description,
    images,
    usageRules,
    location,
    capacity,
    status: status || "available",
  });
  await newResource.save();
  const qrCodeDataURL = await QRCode.toDataURL(`resource:${newResource._id}`);
  newResource.qrcode = qrCodeDataURL;
  await newResource.save();
  return res.status(201).json({
    success: true,
    message: "Tạo tài nguyên thành công",
    data: newResource,
  });
});

// [GET] /api/resources
exports.getAllResources = asyncHandler(async (req, res) => {
  const allowedFilters = ["name", "type", "status"];
  const { filter, page, limit, skip } = getPaginationAndFilter(
    req.query,
    allowedFilters
  );
  if (filter.name) {
    filter.name = { $regex: filter.name, $options: "i" };
  }
  filter.deleted = false;
  const total = await Resource.countDocuments(filter);
  const resources = await Resource.find(filter)
    .populate("type", "name -_id")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
  return res.json({
    success: true,
    message: "Lấy danh sách tài nguyên thành công",
    data: {
      total,
      page,
      limit,
      resources,
    },
  });
});

// [GET] /api/resources/:id
exports.getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findOne({
    _id: req.params.id,
    deleted: false,
  }).populate("type", "name -_id");
  if (!resource) {
    throw new AppError(404, "Không tìm thấy tài nguyên", "NOT_FOUND");
  }
  return res.json({
    success: true,
    message: "Lấy chi tiêt tài nguyên thành công",
    data: resource,
  });
});

// [PUT] /api/resources/:id
exports.updateResource = asyncHandler(async (req, res) => {
  const updateData = req.body;
  if (updateData.type) {
    const typeExists = await ResourceType.findById(updateData.type);
    if (!typeExists) {
      throw new AppError(404, "Loại tài nguyên không tồn tại", "NOT_FOUND");
    }
  }
  if (req.files && req.files.length > 0) {
    updateData.images = req.files.map((file) => file.path);
  }
  const updatedResource = await Resource.findOneAndUpdate(
    { _id: req.params.id, deleted: false },
    updateData,
    { new: true }
  );
  if (!updatedResource) {
    throw new AppError(404, "Không tìm thấy tài nguyên", "NOT_FOUND");
  }
  return res.json({
    success: true,
    message: "Cập nhật tài nguyên thành công",
    data: updatedResource,
  });
});

// [DELETE] /api/resources/:id
exports.deleteResource = asyncHandler(async (req, res) => {
  const deletedResource = await Resource.findOneAndUpdate(
    { _id: req.params.id, deleted: false },
    { deleted: true },
    { new: true }
  );
  if (!deletedResource) {
    throw new AppError(404, "Không tìm thấy tài nguyên", "NOT_FOUND");
  }
  return res.json({
    success: true,
    message: "Xóa tài nguyên thành công",
    data: deletedResource,
  });
});
