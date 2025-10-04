const Resource = require("../models/resource.model");
const ResourceType = require("../models/resourceType.model");
const QRCode = require("qrcode");
const { getPaginationAndFilter } = require("../utils/pagination");
const AppError = require("../utils/AppError");
const asyncHandler = require("express-async-handler");
const { deleteCloudinaryImages } = require("../utils/cloudinary");
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
    .populate("type", "name")
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
  }).populate("type", "name");
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
  const updateData = { ...req.body };
  const currentResource = await Resource.findOne({
    _id: req.params.id,
    deleted: false,
  });
  if (!currentResource) {
    throw new AppError(404, "Không tìm thấy tài nguyên", "NOT_FOUND");
  }
  if (updateData.type) {
    const typeExists = await ResourceType.findById(updateData.type);
    if (!typeExists) {
      throw new AppError(404, "Loại tài nguyên không tồn tại", "NOT_FOUND");
    }
  }
  let existingImages = [];
  if (typeof updateData.existingImages !== "undefined") {
    try {
      const parsed = JSON.parse(updateData.existingImages);
      if (Array.isArray(parsed)) {
        existingImages = parsed.filter(Boolean);
      } else if (parsed) {
        existingImages = [parsed];
      }
    } catch (error) {
      if (typeof updateData.existingImages === "string") {
        existingImages = [updateData.existingImages].filter(Boolean);
      }
    }
  } else if (updateData.images) {
    existingImages = Array.isArray(updateData.images)
      ? updateData.images.filter(Boolean)
      : [updateData.images].filter(Boolean);
  }

  delete updateData.existingImages;

  const uploadedImages =
    req.files && req.files.length > 0 ? req.files.map((file) => file.path) : [];

  if (
    uploadedImages.length > 0 ||
    typeof updateData.images !== "undefined" ||
    typeof req.body.existingImages !== "undefined"
  ) {
    const mergedImages = [...existingImages, ...uploadedImages].filter(Boolean);
    updateData.images = Array.from(new Set(mergedImages));
  }

  const nextImages = updateData.images || currentResource.images || [];
  updateData.images = nextImages;

  const removedImages = (currentResource.images || []).filter(
    (image) => !nextImages.includes(image)
  );

  const updatedResource = await Resource.findByIdAndUpdate(
    currentResource._id,
    updateData,
    { new: true }
  );

  if (removedImages.length > 0) {
    await deleteCloudinaryImages(removedImages);
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
  if (Array.isArray(deletedResource.images) && deletedResource.images.length) {
    await deleteCloudinaryImages(deletedResource.images);
  }
  return res.json({
    success: true,
    message: "Xóa tài nguyên thành công",
    data: deletedResource,
  });
});
